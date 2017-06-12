let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Counter             = require("common-utils/lib/counter"),
    Generate            = require("utils/generate"),
    Kafka               = require("utils/kafka"),
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
     * This function create a nameId based on a product name.
     */
    async createNameId(
        name,
        trackId
    ) {
        let result,
            logger = Logger.create("create", trackId);

        logger.info("enter", {name});

        try {
            result = await Generate.name({
                name: name,
                nameKey: "nameId",
                collection: this.collection,
                nameValue: lodash.kebabCase(name).replace(/-g-/, "g-").replace(/-c-/, "-")
            });

            logger.debug("generate name success", {result});
        }
        catch(error) {
            logger.error("generate name error", error);

            throw new Types.ProductError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        return result;
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

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.ProductError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Get valid data
        data = valid.value;

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

        if(!data.nameId) {
            data.nameId = await this.createNameId(data.name, logger.trackId);
        }

        // Add meta infos
        data.createdAt = moment().toISOString();
        data.deletedAt = null;
        data.hash = `${data.category}${data.nameId}`;

        logger.info("valid data", {data});

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

        // Emit event
        Kafka.emit("product:created", {
            product: data,
            trackId: logger.trackId
        });

        return Object.assign(data, {_id: lodash.toString(result.insertedId)});
    }
};
