let lodash                  = require("lodash"),
    ListSubscriptionSrv     = require("services/list_subscription"),
    //ProductsSrv             = require("services/product"),
    OrderSrv                = require("services/order"),
    //ListSrv                 = require("services/list"),
    BillingSrv              = require("services/billing"),
    ProductSrv              = require("services/product"),
    LoggerFactory           = require("common-logger"),
    config                  = require("common-config"),
    populate                = require("common-utils/lib/populate"),
    Notification            = require("utils/notification"),
    OrderUtils              = require("utils/order"),
    Types                   = require("types"),
    CronJob                 = require("cron").CronJob,
    moment                  = require("moment");

// Instantiate the logger factory.
let Logger = new LoggerFactory("list.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    /**
     * Constructor
     */
    constructor() {

        // @TODO : Maybe this should move to list_subscription
        // service.

        // Every friday we gonna check for subscribed lists
        // and notify users about it. Uppon user confirmation
        // we gonna create the order and charge it.
        
        // Every friday we gonna check for subscribed lists
        // create unapproved order for that lists and inquire
        // users to approve the order. Uppon approve we gonna
        // charge the order (using billing source attached to
        // the list).
        let cronPattern = lodash.get(config, "cron.listSubscription.pattern");
        let allowedDeliverWeekdays = lodash.get(config, "order.allowedDeliverWeekdays");
        let minimumDaysToDeliver = lodash.get(config, "order.minimumDaysToDeliver");
        let runWeekdays = {};

        allowedDeliverWeekdays = lodash.keys(allowedDeliverWeekdays);

        for(let weekday of allowedDeliverWeekdays) {
            // We going to run the job a minimumDaysToDeliver before
            // deliver weekday.
            let runWeekday = moment().isoWeekday(weekday).subtract(minimumDaysToDeliver, "days").isoWeekday();
            runWeekdays[runWeekday] = true;
        }

        runWeekdays = lodash.keys(runWeekdays);

        // Update cron pattern string with runWeekdays.
        cronPattern = `${cronPattern} ${runWeekdays.join(",")}`;

        // Log
        console.log("######################");
        console.log("CRON PATTERN");
        console.log("runWeekdays", runWeekdays);
        console.log("cronPattern", cronPattern);

        this.listSubscriptionJob = new CronJob({
            cronTime: cronPattern,
            onTick: this.handleCronJob.bind(this),
            start: true,
            runOnInit: false,
            timeZone: "America/Sao_Paulo"
        });
    }

    /**
     * This function creates a new record.
     */
    async create(req, res) {
        let result,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);

        // Process data creator
        data.user = req.user._id;

        // Try to create a new entity.
        try {
            result = await ListSubscriptionSrv.client.create(
                new ListSubscriptionSrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("list subscription service create error", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function find generic records in the system.
     */
    async find(req, res) {
        let records,
            query = req.query,
            logger = Logger.create("find", req.trackId);

        logger.info("enter", {query});

        // Prevent to find subscription of another users.
        query.user = [req.uid];

        // Try to find records
        try {
            records = await ListSubscriptionSrv.client.find(
                new ListSubscriptionSrv.types.Query(req.query),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("list subscription service find error", error);
            return res.serverError(error);
        }

        logger.info("list subscription service find success", {
            count: records.length
        });

        // Populate
        populate(records, lodash.flatten([req.query.populate]), {
            "list": require("services/list"),
            "user": require("services/user")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records);
        });
    }

    /**
     * This function count records matching a query in the system.
     */
    async count(req, res) {
        let count,
            logger = Logger.create("count", req.trackId),
            query = new ListSubscriptionSrv.types.Query(Object.assign(req.query, {
                users: [req.uid]
            }));

        logger.info("enter", {query: req.query});

        // Try to count records
        try {
            count = await ListSubscriptionSrv.client.count(query, logger.trackId);
        }
        catch(error) {
            logger.error("list subscription service count error", error);
            return res.serverError(error);
        }

        logger.info("list subscription service count success", {count});

        res.success(count);
    }

    /**
     * This function finds a record by it's unique id.
     */
    async findById(req, res) {
        let record,
            logger = Logger.create("findById", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find records
        try {
            record = await ListSubscriptionSrv.client.findById(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("list subscription service findById error", error);
            return res.serverError(error);
        }

        logger.info("list subscription service findById success", record);

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "list": require("services/list"),
            "user": require("services/user")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records[0]);
        });
    }

    /**
     * This function updates a record.
     */
    async update(req, res) {
        let result,
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // First find the list to check if user is authorized
        // to update.
        try {
            result = await ListSubscriptionSrv.client.findById(req.params.id, logger.trackId);
            logger.info("list subscription service findById success", result);

            if(result.user != req.uid) {
                return res.serverError(new Types.ApiError({
                    code: Types.ErrorCode.UNAUTHORIZED,
                    message: "You must be an owner of this list subscription to update it"
                }));
            }
        }
        catch(error) {
            logger.error("list subscription service findById error", error);
            return res.serverError(error);
        }

        // Now try to update the record.
        try {
            result = await ListSubscriptionSrv.client.update(
                req.params.id,
                new ListSubscriptionSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("list subscription service update error", error);
            return res.serverError(error);
        }

        logger.info("list subscription service update success", result);
        res.success(result);
    }

    /**
     * This function removes a record.
     */
    async remove(req, res) {
        let result,
            logger = Logger.create("remove", req.trackId);

        logger.info("enter", req.body);

        // Try to remove a record.
        try {
            result = await ListSubscriptionSrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("list subscription service remove error", error);
            return res.serverError(error);
        }

        logger.info("list subscription service remove success", result);
        res.success(result);
    }

    /**
     * This function handle cron job to check list subscriptions.
     */
    async handleCronJob({todayDate=null}={}) {
        let result,
            results,
            subscriptions,
            promises = [],
            minimumDaysToDeliver = lodash.get(config, "order.minimumDaysToDeliver"),
            todayMoment = moment(todayDate),
            logger = Logger.create("handleCronJob");

        let query = {
            status: ["active"],
            nextDeliverDate: {
                gte: todayMoment.clone().add(minimumDaysToDeliver,"days").startOf("day").toISOString(),
                lte: todayMoment.clone().add(minimumDaysToDeliver,"days").endOf("day").toISOString()
            }
        };

        logger.info("enter", {query});

        try {
            subscriptions = await ListSubscriptionSrv.client.find(
                new ListSubscriptionSrv.types.Query(query),
                logger.trackId
            );

            logger.info("list subscription service find success", subscriptions);
        }
        catch(error) {
            logger.error("list subscription service find error", error);
        }

        // Try to populate subscritions
        try {
            subscriptions = await populate(subscriptions, [
                "user", "list", "list.items[].product"
            ], {
                "user": require("services/user"),
                "list": require("services/list"),
                "list.items[].product": require("services/product")
            });
        }
        catch(error) {
            logger.error("list subscription populate error", error);
        }

        // Now let's iterate over subscriptions to bild the orders.
        for(let subscription of subscriptions) {
            logger.debug("subscription", subscription);

            // If subscription does not have a billingSource or an address setup,
            // then report the user.
            // 
            // @TODO : When user update it's billingSources or address we must
            // iterate through active subscriptions and strip removed billingSources
            // and address (maybe passing a subscription to an "invalid status").
            if(!subscription.billingSource || !subscription.address) {continue;}

            // Build the subscription order.
            let order = {
                totalPrice: 0,
                grossTotalPrice: 0,
                address: subscription.address,
                user: lodash.get(subscription,"user._id"),
                list: lodash.get(subscription,"list._id"),
                listSubscription: subscription._id,
                items: [],
                status: OrderSrv.types.Status.UNAPPROVED,
                deliverDate: subscription.nextDeliverDate
            };

            //console.log("##### subscription", JSON.stringify(subscription));

            for(let item of lodash.get(subscription, "list.items")||[]) {
                order.grossTotalPrice += (item.quantity * lodash.get(item,"product.priceValue"));
                order.items.push({
                    product: lodash.get(item,"product._id"),
                    quantity: item.quantity,
                    priceValue: lodash.get(item, "product.priceValue"),
                    status: lodash.get(item,"product.type") == ProductSrv.types.SupplyType.ON_STOCK ?
                        OrderSrv.types.ItemStatus.STOCKED :
                        OrderSrv.types.ItemStatus.PENDING,
                    stockedQuantity: lodash.get(item,"product.type") == ProductSrv.types.SupplyType.ON_STOCK ?
                        item.quantity : 0
                });
            }

            // Fees
            let {totalFee, appliedFees} = OrderUtils.getTotalFee(order);

            // Total price.
            order.totalPrice = order.grossTotalPrice + totalFee;
            order.totalFee = totalFee;
            order.fees = appliedFees;

            logger.debug("order to be created", order);

            ((subscription) => {
                promises.push(
                    OrderSrv.client.create(order)
                    .then((order) => {
                        return {order, subscription};
                    })
                    .catch((error) => {
                        logger.error("order service create error", error);
                    })
                );
            })(subscription);
        }
        
        // Await for all order to be created.
        try {
            results = await Promise.all(promises);
            logger.info("order service create all success", results);
        }
        catch(error) {
            logger.error("order service create all error", error);
        }

        // Iterate over results to create billing orders
        promises = [];

        for(result of results) {
            let {order,subscription} = result;

            // Build billing order data
            let billingOrderData = {
                _id: order._id,
                customer: lodash.get(subscription,"user.billingCustomer"),
                currency: order.currencyCode,
                items: []
            };
            
            for(let item of order.items) {
                billingOrderData.items.push({
                    product: item.product,
                    price: item.priceValue,
                    currency: item.currencyCode,
                    quantity: item.quantity
                });
            }

            ((order) => {
                promises.push(
                    BillingSrv.client.orderCreate(billingOrderData, logger.trackId)
                    .then((billingOrder) => {
                        logger.info("billing service orderCreate success", billingOrder);
                        order.billingOrder = billingOrder._id;
                    })
                    .catch((error) => {
                        logger.error("billing service orderCreate error", error);
                    })
                );
            })(order);
        }

        // Await for all billing order to be created.
        try {
            await Promise.all(promises);
            logger.info("billing service orderCreate all success", results);
        }
        catch(error) {
            logger.error("billing service orderCreate all error", error);
        }

        // Notify users
        for(result of results) {
            let {order,subscription} = result;

            // Notify users by sms.
            Notification.emit([{
                channel: "sms",
                users: [order.user],
                type: "list:order:created",
                body: {
                    data: {
                        order,
                        subscription
                    }
                }
            },
            {
                channel: "email",
                users: [order.user],
                type: "list_subscription:order:created",
                body: {
                    data: {
                        order,
                        subscription
                    }
                }
            },
            {
                channel: "email",
                roles: ["admin"],
                type: "admin:message",
                body: {
                    subject: "list_order_created",
                    data: order
                }
            }]);
        }
    }
};