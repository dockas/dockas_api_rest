let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Kafka               = require("utils/kafka"),
    //Socket              = require("utils/socket"),
    Types               = require("../types"),
    Utils               = require("../utils"),
    Model               = require("./model");

let Logger = new LoggerFactory("list.subscription");

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

            throw new Types.ListSubscriptionError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Validate next deliver date
        if(!Utils.isValidNextDeliverDate(data.nextDeliverDate)) {
            logger.error("invalid next deliver date");

            throw new Types.ListSubscriptionError({
                code: Types.ErrorCode.INVALID_NEXT_DELIVER_DATE,
                message: "invalid next deliver date"
            });
        }

        logger.debug("valid data", {data: data});

        // Add meta infos
        data = valid.value;
        data.createdAt = moment().toISOString();
        data.nextDeliverDate = moment(data.nextDeliverDate).toISOString();
        data.deletedAt = null;

        // Try to insert to collection
        try {
            result = await this.collection.insertOne(data);
            logger.info("collection insertOne success", {id: result.insertedId});
        }
        catch(error) {
            logger.error("collection insertOne error", error);

            throw new Types.ListSubscriptionError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Update data with id
        data = Object.assign(data, {_id: lodash.toString(result.insertedId)});

        // Emit event
        Kafka.emit("list_subscription:created", {
            subscription: data,
            trackId: logger.trackId
        });

        // Return created data.
        return data;
    }
};
