let Joi                 = require("joi"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Mongo               = require("common-utils/lib/mongo"),
    Types               = require("../types"),
    Model               = require("./model"),
    parseQuery          = require("./parse");

let Logger = new LoggerFactory("user");

module.exports = class FindHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
    }

    /**
     * This function find users that match a query.
     */
    async find(
        query,
        trackId
    ) {
        let data,
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

            throw new Types.UserError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Parse query to mongodb query
        let mquery = parseQuery(query);

        // Return an error if no query params were provided.
        if(lodash.size(mquery) == 0) {
            throw new Types.UserError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: "no query params provided"
            });
        }

        logger.debug("parse query success", {mquery: mquery});

        try {
            logger.debug("query select", {select: query.select});
            data = await this.collection.find(mquery, query.select||{}).toArray();
        }
        catch(error) {
            logger.error("collection find error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        logger.info("collection find success", {
            count: data.length
        });

        return Model.format(data);
    }

    /**
     * This function finds a user by it's id.
     *
     * @TODO : Use the generic find method here.
     */
    async findById(
        id,
        trackId
    ) {
        // Local variables
        let data,
            logger = Logger.create("findById", trackId);

        logger.info("enter", {id: id});

        // Try to find the item
        try {
            data = await this.collection.findOne({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            });
        }
        catch(error) {
            logger.error("collection findOne error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Item not found
        if(!data) {
            logger.error("collection findOne not found");

            throw new Types.UserError({
                code: Types.ErrorCode.NOT_FOUND,
                message: "not found"
            });
        }

        data = Model.format(data);
        logger.info("collection findOne success", data);

        return data;
    }

    /**
     * This function finds a user by it's unique email.
     *
     * @TODO : Use the generic find method here.
     */
    async findByEmail(
        email,
        trackId
    ) {
        // Local variables
        let data,
            logger = Logger.create("findByEmail", trackId);

        logger.info("enter", {email});

        // Try to find the item
        try {
            data = await this.collection.findOne({
                email,
                deletedAt: {$type: "null"}
            });
        }
        catch(error) {
            logger.error("collection findOne error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Item not found
        if(!data) {
            logger.error("collection findOne not found");

            throw new Types.UserError({
                code: Types.ErrorCode.NOT_FOUND,
                message: "not found"
            });
        }

        data = Model.format(data);
        logger.info("collection findOne success", data);

        return data;
    }
};
