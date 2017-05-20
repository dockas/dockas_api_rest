let lodash          = require("lodash"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate"),
    OrderSrv        = require("services/order"),
    UserSrv         = require("services/user"),
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
        let result,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);
        
        // @TODO : Verify paypal info before create the order.
        // This prevents an user to create order with fake 
        // paypal info.

        // Set order user as current user.
        data.user = req.uid;

        // Try to create a new entity.
        try {
            result = await OrderSrv.client.create(
                new OrderSrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("order service create error", error);
            return res.serverError(error);
        }

        logger.info("order service create success", result);
        res.success(result);
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
};
