let lodash          = require("lodash"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate"),
    OrderSrv        = require("services/order"),
    UserSrv         = require("services/user"),
    BillingSrv      = require("services/billing"),
    Types           = require("types");

// Instantiate the logger factory.
let Logger = new LoggerFactory("order.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    /**
     * This function creates a new record.
     */
    static async create(req, res) {
        let orderResult,
            billingOrderResult,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);

        // Set metadata
        data.user = req.uid;

        // Try to create a new order.
        try {
            orderResult = await OrderSrv.client.create(
                new OrderSrv.types.Data(data),
                logger.trackId
            );

            logger.info("order service create success", orderResult);
        }
        catch(error) {
            logger.error("order service create error", error);
            return res.serverError(error);
        }

        // Build billing order data
        let billingOrderData = {
            _id: orderResult,
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
            billingOrderResult = await BillingSrv.client.orderCreate(billingOrderData, logger.trackId);
            logger.info("billing service orderCreate success", billingOrderResult);
        }
        catch(error) {
            logger.error("billing service orderCreate error", error);
            return res.serverError(error);
        }

        res.success(orderResult);
    }

    /**
     * This function find generic records in the system.
     *
     * @TODO : non admin user can search only within it's
     * own orders.
     */
    static async find(req, res) {
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
    static async findById(req, res) {
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
    static async update(req, res) {
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
    static async updateStatus(req, res) {
        let result,
            order,
            logger = Logger.create("updateStatus", req.trackId),
            nonAdminAllowedStatus = [
                OrderSrv.types.STATUS_USER_AVAILABLE,
                OrderSrv.types.STATUS_USER_UNAVAILABLE
            ];

        logger.info("enter", req.body);

        // Try to find the order
        try {
            order = await OrderSrv.client.findById(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("order service findById error", error);
            return res.serverError(error);
        }

        // The only status that can be updated by non admins
        // is user availability status.
        if(req.user.roles.indexOf(UserSrv.types.ROLE_ADMIN) < 0) {
            if(nonAdminAllowedStatus.indexOf(req.body.status) < 0) {
                return res.unauthorized(
                    new Types.ApiError({
                        code: Types.ErrorCode.ONLY_ADMINS_ALLOWED,
                        message: "you must be an admin to perform this request"
                    })
                );
            }

            // Check if user is the owner of the order.
            if(order.user != req.uid) {
                return res.unauthorized(
                    new OrderSrv.types.OrderError({
                        code: OrderSrv.types.ErrorCode.NOT_OWNER,
                        message: "You are not the owner of this order"
                    })
                );
            }
        }

        // Try to update order status.
        try {
            result = await OrderSrv.client.updateStatus(
                req.params.id,
                req.body.status,
                nonAdminAllowedStatus.indexOf(req.body.status) >= 0, // prevent alerting
                logger.trackId
            );
        }
        catch(error) {
            logger.error("order service updateStatus error", error);
            return res.serverError(error);
        }

        logger.info("order service updateStatus success", result);
        res.success(true);
    }

    /**
     * This function removes a record.
     */
    static async remove(req, res) {
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
    static async charge(req, res) {
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
    static async chargeFind(req, res) {
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
};
