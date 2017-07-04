let Joi                 = require("joi"),
    LoggerFactory       = require("common-logger"),
    Mongo               = require("common-utils/lib/mongo"),
    Types               = require("../types"),
    Model               = require("./model"),
    Parser              = require("./parse");

let Logger = new LoggerFactory("notification_alert");

module.exports = class FindHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
    }

    /**
     * This is the main handler function.
     */
    async find(
        query,
        trackId
    ) {
        let records,
            valid,
            logger = Logger.create("find", trackId),
            schema = Model.Schema;

        logger.info("enter", {
            query: query
        });

        // Validate query schema
        valid = Joi.validate(query, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.NotificationAlertError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Parse query to mongodb query
        let mquery = Parser.parseQuery(query);

        logger.debug("parse query success", {mquery: mquery});

        try {
            logger.debug("query select", {select: query.select});
            records = await this.collection.find(mquery, query.select||{})
                .sort(query.sort)
                .toArray();
        }
        catch(error) {
            logger.error("collection find error", error);

            throw new Types.NotificationAlertError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        logger.info("collection find success", {
            count: records.length
        });

        return Model.format(records);
    }

    /**
     * This function finds an entity by it's id.
     *
     * @TODO : Use the generic find method here.
     */
    async findById(
        id,
        trackId
    ) {
        // Local variables
        let record,
            logger = Logger.create("findById", trackId);

        logger.info("enter", {id: id});

        // Try to find the record
        try {
            record = await this.collection.findOne({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            });
        }
        catch(error) {
            logger.error("collection findOne error", error);

            throw new Types.NotificationAlertError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Record not found
        if(!record) {
            logger.error("collection findOne not found");

            throw new Types.NotificationAlertError({
                code: Types.ErrorCode.NOT_FOUND,
                message: "alert not found"
            });
        }

        record = Model.format(record);
        logger.info("collection findOne success", record);

        return record;
    }

    /**
     * This function counts entries in database.
     */
    async count(
        query,
        trackId
    ) {
        let count,
            valid,
            logger = Logger.create("count", trackId),
            schema = Model.Schema;

        logger.info("enter", {
            query: query
        });

        // Validate query schema
        valid = Joi.validate(query, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.NotificationAlertError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Parse query to mongodb query
        let mquery = Parser.parseQuery(query);

        logger.debug("parse query success", {mquery: mquery});

        try {
            count = await this.collection.count(mquery);
        }
        catch(error) {
            logger.error("collection find error", error);

            throw new Types.NotificationAlertError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        logger.info("collection count success", {count});

        return count;
    }
};
