let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("product");

/**
 * The handler class.
 */
module.exports = class CreateHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
    }

    /**
     * This function creates a new entity.
     */
    async create(
        data,
        trackId
    ) {
        // Local variables
        let valid,
            result,
            logger = Logger.create("create", trackId),
            schema = Model.Schema;

        logger.info("enter", {data: data});

        // Validate data schema
        valid = Joi.validate(data, schema);
        data = valid.value;

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.ProductError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta infos
        data.createdAt = moment().toISOString();
        data.deletedAt = null;

        logger.info("valid data", {data: data});

        // Try to insert to collection
        try {
            result = await this.collection.insertOne(data);
            logger.info("collection insertOne success", {id: result.insertedId});
        }
        catch(error) {
            logger.error("collection insertOne error", error);

            throw new Types.ProductError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        return lodash.toString(result.insertedId);
    }
};
