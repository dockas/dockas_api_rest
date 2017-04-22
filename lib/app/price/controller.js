let PriceCtrl       = require("services/price"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("price.ctrl");

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

        // Set creator as current user.
        data.creator = req.uid;

        // Try to create a new entity.
        try {
            result = await PriceCtrl.client.create(
                new PriceCtrl.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("price service create error", error);
            return res.serverError(error);
        }

        logger.info("price service create success", result);
        res.success(result);
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new PriceCtrl.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await PriceCtrl.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("price service find error", error);
            return res.serverError(error);
        }

        logger.info("price service find success", {
            count: records.length
        });

        res.success(records);
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
            result = await PriceCtrl.client.update(
                req.params.id,
                new PriceCtrl.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("price service update error", error);
            return res.serverError(error);
        }

        logger.info("price service update success", result);
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
            result = await PriceCtrl.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("price service remove error", error);
            return res.serverError(error);
        }

        logger.info("price service remove success", result);
        res.success(true);
    }
};
