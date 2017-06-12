let lodash          = require("lodash"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate"),
    OrderSrv        = require("services/order"),
    UserSrv         = require("services/user"),
    BillingSrv      = require("services/billing"),
    Email           = require("utils/email"),
    Kafka           = require("utils/kafka"),
    Types           = require("types");

// Instantiate the logger factory.
let Logger = new LoggerFactory("order.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    constructor() {
        Kafka.on("billing:gateway_notification:order.payment_succeeded", this.handleOrderPaymentSucceededEvent.bind(this));
    }

    /**
     * This function creates a new record.
     */
    async create(req, res) {
        let result,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);

        // Set metadata
        data.user = req.uid;

        // Try to create a new order.
        try {
            result = await OrderSrv.client.create(
                new OrderSrv.types.Data(data),
                logger.trackId
            );

            logger.info("order service create success", result);
        }
        catch(error) {
            logger.error("order service create error", error);
            return res.serverError(error);
        }

        // Build billing order data
        let billingOrderData = {
            _id: result._id,
            customer: req.user.billingCustomer,
            currency: data.currencyCode,
            items: []
        };
        
        for(let item of data.items) {
            billingOrderData.items.push({
                product: item.product,
                price: item.priceValue,
                currency: item.currencyCode,
                quantity: item.quantity
            });
        }

        // Try to create a billing order.
        try {
            let billingOrder = await BillingSrv.client.orderCreate(billingOrderData, logger.trackId);
            logger.info("billing service orderCreate success", billingOrder);

            result.billingOrder = billingOrder._id;
        }
        catch(error) {
            logger.error("billing service orderCreate error", error);
            return res.serverError(error);
        }

        // Send email to admins. But first, populate it with
        // user data and item product.
        populate([lodash.cloneDeep(result)], ["user", "items[].product"], {
            "user": require("services/user"),
            "items[].product": require("services/product")
        }).then((results) => {
            logger.debug("service populate success", results);

            Email.shared.sendToAdmins("email:admin_notification", {
                subject: "new_order",
                data: results[0]
            });
        });

        // Send result
        res.success(result);
    }

    /**
     * This function find generic records in the system.
     *
     * @TODO : non admin user can search only within it's
     * own orders.
     */
    async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new OrderSrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await OrderSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("order service find error", error);
            return res.serverError(error);
        }

        logger.info("order service find success", {
            count: records.length
        });

        // Populate
        populate(records, lodash.flatten([req.query.populate]), {
            "user": require("services/user"),
            "items[].product": require("services/product")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records);
        });
    }

    /**
     * This function finds a specific order.
     */
    async findById(req, res) {
        let record,
            logger = Logger.create("findById", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find record
        try {
            record = await OrderSrv.client.findById(req.params.id, logger.trackId);
            logger.info("order service findById success", record);
        }
        catch(error) {
            logger.error("order service findById error", error);
            return res.serverError(error);
        }

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "user": require("services/user"),
            "items[].product": require("services/product")
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

        // Try to update user profile.
        try {
            result = await OrderSrv.client.update(
                req.params.id,
                new OrderSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("order service update error", error);
            return res.serverError(error);
        }

        logger.info("order service update success", result);
        res.success(true);
    }

    /**
     * This function updates the status of a record.
     */
    async updateStatus(req, res) {
        let result,
            logger = Logger.create("updateStatus", req.trackId);

        logger.info("enter", req.body);

        // Try to update order status.
        try {
            result = await OrderSrv.client.updateStatus(
                req.params.id,
                req.body.status,
                false,
                logger.trackId
            );

            logger.info("order service updateStatus success", result);
        }
        catch(error) {
            logger.error("order service updateStatus error", error);
            return res.serverError(error);
        }

        // Send order_status_updated email to user.
        populate([lodash.cloneDeep(result)], ["user"], {
            "user": require("services/user")
        }).then((results) => {
            logger.debug("service populate success");

            let order = results[0];

            // Send email to user
            Kafka.emit("email:order_status_updated", {
                to: [order.user.email],
                body: {
                    data: order
                }
            });
        });

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
            result = await OrderSrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("order service remove error", error);
            return res.serverError(error);
        }

        logger.info("order service remove success", result);
        res.success(true);
    }

    /**
     * This function charges an order.
     */
    async charge(req, res) {
        let result,
            order,
            logger = Logger.create("charge", req.trackId);

        // Try to find the order by it's id.
        try {
            order = await OrderSrv.client.findById(req.params.id);
            logger.info("order service findById success", order);
        }
        catch(error) {
            logger.error("order service findById error", error);
            return res.serverError(error);
        }

        // Check if there is a billingOrder associated.
        // 
        // @TODO : Try to charge some times case billingOrder was
        // not created yet.
        if(!order.billingOrder) {
            return res.serverError(new Types.ApiError({
                code: Types.ErrorCode.MISSING_BILLING_INFO,
                message: "missing billingOrder field"
            }));
        }

        // Try to charge the order.
        try {
            result = await BillingSrv.client.chargeCreate({
                customer: req.user.billingCustomer,
                source: req.body.source,
                order: order.billingOrder
            });

            logger.info("billing service chargeCreate success", result);
        }
        catch(error) {
            logger.error("billing service chargeCreate success", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function finds a charge assotiated to a specific order.
     */
    async chargeFind(req, res) {
        let result,
            order,
            logger = Logger.create("chargeFind", req.trackId);

        // Try to find the order by it's id.
        try {
            order = await OrderSrv.client.findById(req.params.id);
            logger.info("order service findById success", order);
        }
        catch(error) {
            logger.error("order service findById error", error);
            return res.serverError(error);
        }

        if(!order.billingCharge) {
            return res.serverError(new Types.ApiError({
                code: Types.ErrorCode.MISSING_BILLING_INFO,
                message: "missing billingCharge field"
            }));
        }

        // Try to find charge.
        try {
            result = await BillingSrv.client.chargeFindById(order.billingCharge);
            logger.info("billing service chargeFindById success", result);
        }
        catch(error) {
            logger.error("billing service chargeFindById success", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function handles billing gateway notification.
     */
    async handleOrderPaymentSucceededEvent(data={}) {
        let {notification} = data,
            logger = Logger.create("handleOrderPaymentSucceededEvent", data.trackId);

        logger.info("enter", data);

        // Extract relevant data from notification.
        let {order} = notification.data;
        logger.info("order", {order});

        // We must:
        // (1) update the order status.
        // (2) email user with order info.
        // (3) email admins with order info.
        // Find order.
        
        // Try to find the order by billingOrder
        try {
            order = await OrderSrv.client.findByBillingOrderId(order);
            logger.info("order service findByBillingOrderId success", order);
        }
        catch(error) {
            return logger.error("order service update error", error);
        }

        // Let's update order status
        try {
            order = await OrderSrv.client.updateStatus(
                order._id, 
                OrderSrv.types.Status.PAYMENT_AUTHORIZED,
                false,
                logger.trackId
            );

            logger.info("order service update success", order);
        }
        catch(error) {
            return logger.error("order service update error", error);
        }

        // Populate order with data
        let results = await populate([order], ["user", "items[].product","items[].product.mainProfileImage"], {
            "user": require("services/user"),
            "items[].product": require("services/product"),
            "items[].product.mainProfileImage": require("services/file")
        });

        // Set order as first result.
        order = results[0];
        logger.debug("populate completed", order);

        // Email user with order details.
        Kafka.emit("email:order_payment_authorized", {
            to: [order.user.email],
            body: {data: order}
        });

        // Email admins with order details
        Email.shared.sendToAdmins("email:admin_notification", {
            subject: "order_payment_authorized",
            data: order
        });
    }
};
