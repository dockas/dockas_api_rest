let CouponSrv       = require("services/coupon"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("coupon.ctrl");

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
            result = await CouponSrv.client.create(
                new CouponSrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("coupon service create error", error);
            return res.serverError(error);
        }

        logger.info("coupon service create success", result);
        res.success(result);
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new CouponSrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await CouponSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("coupon service find error", error);
            return res.serverError(error);
        }

        logger.info("coupon service find success", {
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
            query = new CouponSrv.types.Query(Object.assign(req.query, {
                users: [req.uid]
            }));

        logger.info("enter", {query: req.query});

        // Try to count records
        try {
            count = await CouponSrv.client.count(query, logger.trackId);
        }
        catch(error) {
            logger.error("coupon service count error", error);
            return res.serverError(error);
        }

        logger.info("coupon service count success", {count});

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
            record = await CouponSrv.client.findById(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("coupon service findById error", error);
            return res.serverError(error);
        }

        logger.info("coupon service findById success", record);

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
            record = await CouponSrv.client.findByNameId(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("coupon service findByNameId error", error);
            return res.serverError(error);
        }

        logger.info("coupon service findByNameId success", record);

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
            result = await CouponSrv.client.update(
                req.params.id,
                new CouponSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("coupon service update error", error);
            return res.serverError(error);
        }

        logger.info("coupon service update success", result);
        res.success(result);
    }

    /**
     * This function applies a coupon.
     */
    static async apply(req, res) {
        let result,
            logger = Logger.create("apply", req.trackId);

        logger.info("enter", {
            id: req.params.id,
            uid: req.uid
        });

        // Now try to apply the coupon.
        try {
            result = await CouponSrv.client.apply(
                req.params.id,
                req.uid,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("coupon service apply error", error);
            return res.serverError(error);
        }

        logger.info("coupon service apply success", result);
        res.success(result);
    }

    /**
     * This function applies a coupon by it's nameId.
     */
    static async applyByNameId(req, res) {
        let result,
            logger = Logger.create("applyByNameId", req.trackId);

        logger.info("enter", {
            nameId: req.params.id,
            uid: req.uid
        });

        // Now try to update the record.
        try {
            result = await CouponSrv.client.applyByNameId(
                req.params.id,
                req.uid,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("coupon service applyByNameId error", error);
            return res.serverError(error);
        }

        logger.info("coupon service applyByNameId success", result);
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
            result = await CouponSrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("coupon service remove error", error);
            return res.serverError(error);
        }

        logger.info("coupon service remove success", result);
        res.success(result);
    }
};
