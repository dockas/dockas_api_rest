let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Generate            = require("utils/generate"),
    Kafka               = require("utils/kafka"),
    //Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("list");

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

            throw new Types.ListError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        logger.debug("valid data", {data: data});

        // Add meta infos
        data = valid.value;
        data.createdAt = moment().toISOString();
        data.deletedAt = null;

        // Generate a nameId if not provided.
        if(!data.nameId) {
            try {
                data.nameId = await Generate.name({
                    name: data.name,
                    nameKey: "nameId",
                    collection: this.collection
                });

                logger.debug("generate name success", {nameId: data.nameId});
            }
            catch(error) {
                logger.error("generate name error", error);

                throw new Types.ListError({
                    code: Types.ErrorCode.DB_ERROR,
                    message: error.message
                });
            }
        }

        // Try to insert to collection
        try {
            result = await this.collection.insertOne(data);
            logger.info("collection insertOne success", {id: result.insertedId});
        }
        catch(error) {
            logger.error("collection insertOne error", error);

            throw new Types.ListError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Update data with id
        data = Object.assign(data, {_id: lodash.toString(result.insertedId)});

        // Emit event
        Kafka.emit("list:created", {
            list: data,
            trackId: logger.trackId
        });

        // Return created data.
        return data;
    }
};
