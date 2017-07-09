let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Mongo               = require("common-utils/lib/mongo"),
    //Counter             = require("common-utils/lib/counter"),
    Kafka               = require("utils/kafka"),
    //Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("order_item");

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

            throw new Types.ProductSellError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        logger.debug("valid data", {data: data});

        // Get next count.
        /*try {
            let count = await Counter.shared.getNextCount("product_batches");
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
        }*/

        // Add meta infos
        data = valid.value;
        data._id = data._id ? Mongo.ObjectID(data._id) : undefined;
        data.deliverDate = data.deliverDate?moment(data.deliverDate).toISOString():undefined;
        data.pickupDate = data.pickupDate?moment(data.pickupDate).toISOString():undefined;
        data.createdAt = moment().toISOString();
        data.deletedAt = null;

        // Set statusPriority
        if(data.status){ data.statusPriority = Types.StatusPriority.indexOf(data.status); }

        // Try to insert to collection
        try {
            result = await this.collection.insertOne(data);
            logger.info("collection insertOne success", {id: result.insertedId});
        }
        catch(error) {
            logger.error("collection insertOne error", error);

            throw new Types.ProductSellError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Update data with id
        data = Object.assign(data, {_id: lodash.toString(result.insertedId)});

        // Emit event
        Kafka.emit("order_item:created", {
            orderItem: data,
            trackId: logger.trackId
        });

        // Return created data.
        return data;
    }
};
