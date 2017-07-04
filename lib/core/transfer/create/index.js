let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Kafka               = require("utils/kafka"),
    //Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("transfer");

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

            throw new Types.TransferError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta infos
        data = valid.value;
        data.netValue = data.value;
        data.createdAt = moment().toISOString();
        data.deletedAt = null;

        // Evaluate netValue from fees
        for(let fee of data.fees||[]) {
            let feeFixedValue = fee.value;

            if(fee.type == Types.FeeType.PERCENTUAL) {
                feeFixedValue = Math.floor(data.value*fee.value/100);
            }

            data.netValue -= feeFixedValue;
        }

        logger.info("valid data", {data});

        // Try to insert to collection
        try {
            result = await this.collection.insertOne(data);
            logger.info("collection insertOne success", {id: result.insertedId});
        }
        catch(error) {
            logger.error("collection insertOne error", error);

            throw new Types.TransferError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Update data with id
        data = Object.assign(data, {_id: lodash.toString(result.insertedId)});

        // Emit event
        Kafka.emit("transfer:created", {
            body: {data},
            trackId: logger.trackId
        });

        // Return created data.
        return data;
    }
};
