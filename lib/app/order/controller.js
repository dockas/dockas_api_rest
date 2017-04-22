let lodash          = require("lodash"),
    OrderCtrl       = require("services/order"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate");

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

        // Set order user as current user.
        data.user = req.uid;

        // Try to create a new entity.
        try {
            result = await OrderCtrl.client.create(
                new OrderCtrl.types.Data(data),
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
            query = new OrderCtrl.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await OrderCtrl.client.find(query, logger.trackId);
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
            "user": require("services/user")
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
            result = await OrderCtrl.client.update(
                req.params.id,
                new OrderCtrl.types.Data(req.body),
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
     * This function removes a record.
     */
    static async remove(req, res) {
        let result,
            logger = Logger.create("remove", req.trackId);

        logger.info("enter", req.body);

        // Try to remove a record.
        try {
            result = await OrderCtrl.client.remove(
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
