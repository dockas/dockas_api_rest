/* global describe,before,after,it */

let chai            = require("chai"),
    chaiAsPromised  = require("chai-as-promised"),
    Mongo           = require("common-utils/lib/mongo"),
    Counter         = require("common-utils/lib/counter"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger"),
    moment          = require("moment"),
    //Types           = require("./types"),
    Srv             = require("./index");

// Setup chai
chai.should();
chai.use(chaiAsPromised);

// Instantiate the logger
let Logger = new LoggerFactory("order test");

describe("order service", function() {
    let _db, srv;

    // Initilize test environment.
    before(function(){
        let logger = Logger.create("before");
        logger.info("enter");

        return Mongo.connect(config.db.mongo.url)
        .then((db) => {
            _db = db;
        })
        .then(() => {
            return Counter.setupCollection(_db).then(() => {
                new Counter({shared: true});
            });
        })
        .then(() => {
            srv = new Srv({db: _db, mode: "test"});
        });
    });

    // Finalize test environment.
    after(function(done) {
        let logger = Logger.create("after");
        logger.info("enter");

        // Close mongoose connection.
        _db.close(done);
    });

    describe("create function", function() {
        it("should success with valid data and _id string", function() {
            let _id = Mongo.ObjectID().toString();

            console.log("$$$$ generated _id", {_id});

            return srv.create({
                _id,
                user: "fakeUser",
                totalPrice: 0,
                grossTotalPrice: 0,
                deliverDate: moment().toISOString()
            }).should.eventually.be.an("object")
            .and.have.property("_id", _id);
        });
    });
});
