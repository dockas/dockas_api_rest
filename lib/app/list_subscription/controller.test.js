/* global describe,before,after,it */

let chai                    = require("chai"),
    chaiAsPromised          = require("chai-as-promised"),
    moment                  = require("moment"),
    LoggerFactory           = require("common-logger"),
    Mongo                   = require("common-utils/lib/mongo"),
    Counter                 = require("common-utils/lib/counter"),
    config                  = require("common-config"),
    UserSrv                 = require("services/user"),
    OrderSrv                = require("services/order"),
    ListSrv                 = require("services/list"),
    ProductSrv              = require("services/product"),
    BillingSrv              = require("services/billing"),
    ListSubscriptionSrv     = require("services/list_subscription"),
    NotificationSMSCoreSrv  = require("core/notification_sms"),
    NotificationEmailCoreSrv= require("core/notification_email"),
    SocketCoreSrv           = require("core/socket"),
    Socket                  = require("utils/socket"),
    //Types                   = require("../types"),
    Ctrl                    = require("./controller");

// Setup chai
chai.should();
chai.use(chaiAsPromised);

// Instantiate the logger
let Logger = new LoggerFactory("list_subscription controller test");

describe("list_subscription controller", function() {
    let _db, _user, _product, _list, _subscription, _subscription_2, ctrl;

    // Initilize test environment.
    before(function(){
        let logger = Logger.create("before");
        logger.info("enter", config.db.mongo);

        // (1) Create a fake user
        // (2) Create a fake product
        // (3) Create a fake list for the user with just one product
        // (4) Create a fake list_subscription for the list and user

        return Mongo.connect(config.db.mongo.url)
        .then((db) => {
            _db = db;

            new Socket({shared: true});

            // Connect services
            return Promise.all([
                UserSrv.connect(db),
                OrderSrv.connect(db),
                ListSrv.connect(db),
                ListSubscriptionSrv.connect(db),
                ProductSrv.connect(db),
                BillingSrv.connect(db),
                Counter.setupCollection(Mongo.db).then(() => {
                    new Counter({shared: true});
                }),
                Promise.resolve(
                    new NotificationSMSCoreSrv({mode: process.env.NODE_ENV})
                ),
                Promise.resolve(
                    new NotificationEmailCoreSrv({mode: process.env.NODE_ENV})
                ),
                Promise.resolve(
                    new SocketCoreSrv(this.server, {mode: process.env.NODE_ENV})
                )
            ]);
        })
        // Create a fake user
        .then(() => {
            return UserSrv.client.create(
                new UserSrv.types.Data({
                    fullName: "Test User",
                    email: "bruno@nosebit.com",
                    password: "Mula*8",
                    phones: [{
                        areaCode: "31",
                        number: "995370317"
                    }],
                    postalCodeAddress: {
                        neighborhood: "Santo Antônio",
                        street: "Rua Professor Arduino Bolivar",
                        city: "Belo Horizonte",
                        state: "MG",
                        country: "BRA",
                        postalCode: "30350140"
                    },
                })
            ).then((user) => {_user = user;});
        })
        // Create a fake product
        .then(() => {
            return ProductSrv.client.create(
                new ProductSrv.types.Data({
                    creator: _user._id,
                    name: "Test Product",
                    priceValue: 1300,
                    selectedTags: ["fake-tag-1"],
                    tags: ["fake-tag-1"],
                    category: "fake-category"
                })
            ).then((product) => { _product = product; });
        })
        // Create a fake list for the user with one product.
        .then(() => {
            return ListSrv.client.create(
                new ListSrv.types.Data({
                    name: "Test List",
                    creator: _user._id,
                    owners: [{
                        user: _user._id,
                    }],
                    items: [{
                        product: _product._id,
                        quantity: 5
                    }]
                })
            ).then((list) => {_list = list;});
        })
        // Create a fake list subscription with wednesday deliver.
        .then(() => {
            return ListSubscriptionSrv.client.create({
                user: _user._id,
                list: _list._id,
                billingSource: {
                    _id: "fake-id",
                    method: "credit_card"
                },
                address: {},
                recurrence: "weekly",
                nextDeliverDate: moment().add(2,"week").isoWeekday(3).hour(12).minute(0).toISOString()
            }).then((subscription) => {
                _subscription = subscription;
                logger.info("list subscription service create success", subscription);
            });
            
        })
        // Create a fake list subscription with wednesday deliver.
        .then(() => {
            return ListSubscriptionSrv.client.create({
                user: _user._id,
                list: _list._id,
                billingSource: {
                    _id: "fake-id",
                    method: "credit_card"
                },
                address: {},
                recurrence: "weekly",
                nextDeliverDate: moment().add(2,"week").isoWeekday(7).hour(12).minute(0).toISOString()
            }).then((subscription) => {
                _subscription_2 = subscription;
                logger.info("list subscription service create success", subscription);
            });
            
        })
        .then(() => {
            ctrl = new Ctrl();
        });
    });

    // Finalize test environment.
    after(function() {
        let logger = Logger.create("after");
        logger.info("enter");

        //_db.close(done);

        // Drop the database
        /*_db.dropDatabase().then(() => {
            // Close connection.
            _db.close(done);
        });*/
    });

    describe("handleCronJob", function() {
        it("should success when running on friday for nextDeliverDate on wednesday", function() {
            return ctrl.handleCronJob({todayDate: moment().add(1,"week").isoWeekday(5)})
            .should.be.fulfilled;
        });

        it("should success when running on tuesday for nextDeliverDate on sunday", function() {
            return ctrl.handleCronJob({todayDate: moment().add(1,"week").isoWeekday(2)})
            .should.be.fulfilled;
        });
    });
});
