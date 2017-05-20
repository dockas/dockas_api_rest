let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Counter             = require("common-utils/lib/counter"),
    Generate            = require("utils/generate"),
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

        // Get next count.
        try {
            let count = await Counter.shared.getNextCount("products");
            logger.debug("counter getNextCount success", count);

            // Set count to data.
            data.count = count;
        }
        catch(error) {
            logger.error("counter getNextCount error", error);

            throw new Types.OrderError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Add meta infos
        data.createdAt = moment().toISOString();
        data.deletedAt = null;

        // Generate a nameId if not provided.
        if(!data.nameId) {
            try {
                data.nameId = await Generate.name({
                    name: data.name,
                    nameKey: "nameId",
                    collection: this.collection,
                    nameValue: lodash.kebabCase(data.name).replace(/-g-/, "g-").replace(/-c-/, "-")
                });

                logger.debug("generate name success", {nameId: data.nameId});
            }
            catch(error) {
                logger.error("generate name error", error);

                throw new Types.ProductError({
                    code: Types.ErrorCode.DB_ERROR,
                    message: error.message
                });
            }
        }

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
