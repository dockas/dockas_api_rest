let BrandSrv        = require("services/brand"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("brand.ctrl");

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

        // Try to create a new entity.
        try {
            result = await BrandSrv.client.create(
                new BrandSrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("brand service create error", error);
            return res.serverError(error);
        }

        logger.info("brand service create success", result);
        res.success(result);
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new BrandSrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await BrandSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("brand service find error", error);
            return res.serverError(error);
        }

        logger.info("brand service find success", {
            count: records.length
        });

        res.success(records);
    }

    /**
     * This function count records matching a query in the system.
     */
    static async count(req, res) {
        let count,
            logger = Logger.create("count", req.trackId),
            query = new BrandSrv.types.Query(Object.assign(req.query, {
                users: [req.uid]
            }));

        logger.info("enter", {query: req.query});

        // Try to count records
        try {
            count = await BrandSrv.client.count(query, logger.trackId);
        }
        catch(error) {
            logger.error("brand service count error", error);
            return res.serverError(error);
        }

        logger.info("brand service count success", {count});

        res.success(count);
    }

    /**
     * This function finds a record by it's unique id.
     */
    static async findById(req, res) {
        let record,
            logger = Logger.create("findById", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find records
        try {
            record = await BrandSrv.client.findById(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("brand service findById error", error);
            return res.serverError(error);
        }

        logger.info("brand service findById success", record);

        res.success(record);
    }

    /**
     * This function finds a record by it's unique name id.
     */
    static async findByNameId(req, res) {
        let record,
            logger = Logger.create("findByNameId", req.trackId);

        logger.info("enter", {nameId: req.params.id});

        // Try to find records
        try {
            record = await BrandSrv.client.findByNameId(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("brand service findByNameId error", error);
            return res.serverError(error);
        }

        logger.info("brand service findByNameId success", record);

        res.success(record);
    }

    /**
     * This function updates a record.
     */
    static async update(req, res) {
        let result,
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // Now try to update the record.
        try {
            result = await BrandSrv.client.update(
                req.params.id,
                new BrandSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("brand service update error", error);
            return res.serverError(error);
        }

        logger.info("brand service update success", result);
        res.success(result);
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
            result = await BrandSrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("brand service remove error", error);
            return res.serverError(error);
        }

        logger.info("brand service remove success", result);
        res.success(result);
    }
};
