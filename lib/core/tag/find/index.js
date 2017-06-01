let Joi                 = require("joi"),
    LoggerFactory       = require("common-logger"),
    {aqlQuery}          = require("arangojs"),
    Types               = require("../types"),
    Model               = require("./model"),
    parseQuery          = require("./parse");

let Logger = new LoggerFactory("tag");

module.exports = class FindHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.db = opts.db;
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

        logger.info("enter", {query});

        // Validate query schema
        valid = Joi.validate(query, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.TagError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Parse query to mongodb query
        let dbquery = parseQuery(query);

        logger.debug("parse query success", {dbquery});

        try {
            let cursor = await this.db.query(dbquery);
            records = await cursor.all();

            console.log("records", records);
        }
        catch(error) {
            logger.error("collection find error", error);

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        return records;
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
            let cursor = await this.db.query(aqlQuery`
                FOR doc IN ${this.collection}
                FILTER _key == ${id} && deletedAt != null
                RETURN doc
            `);

            record = await cursor.next();
        }
        catch(error) {
            logger.error("collection findOne error", error);

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Record not found
        if(!record) {
            logger.error("collection findOne not found");

            throw new Types.TagError({
                code: Types.ErrorCode.NOT_FOUND,
                message: "tag not found"
            });
        }

        record = Model.format(record);
        logger.info("collection findOne success", record);

        return record;
    }

    /**
     * This function finds an entity by it's id.
     *
     * @TODO : Use the generic find method here.
     */
    async findByNameId(
        nameId,
        trackId
    ) {
        // Local variables
        let record,
            logger = Logger.create("findById", trackId);

        logger.info("enter", {nameId});

        // Try to find the record
        try {
            record = await this.collection.findOne({
                nameId,
                deletedAt: {$type: "null"}
            });
        }
        catch(error) {
            logger.error("collection findOne error", error);

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Record not found
        if(!record) {
            logger.error("collection findOne not found");

            throw new Types.TagError({
                code: Types.ErrorCode.NOT_FOUND,
                message: "tag not found"
            });
        }

        record = Model.format(record);
        logger.info("collection findOne success", record);

        return record;
    }
};
