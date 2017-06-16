let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Counter             = require("common-utils/lib/counter"),
    Kafka               = require("utils/kafka"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("order");

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

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.OrderError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Set valid data
        data = valid.value;

        // Get next count.
        try {
            let count = await Counter.shared.getNextCount("orders");
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

        logger.info("valid data", {data: data});

        // Try to insert to collection
        try {
            result = await this.collection.insertOne(data);
            logger.info("collection insertOne success", {id: result.insertedId});
        }
        catch(error) {
            logger.error("collection insertOne error", error);

            throw new Types.OrderError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Assign id to data
        let order = Object.assign(data, {_id: lodash.toString(result.insertedId)});

        // Emit event
        Kafka.emit("order:created", {order, trackId: logger.trackId});

        // Return
        return order;
    }
};
