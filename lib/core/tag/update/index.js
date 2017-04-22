let Joi                 = require("joi"),
    moment              = require("moment"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("tag");

module.exports = class UpdateHandler {
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
    }

    async update(
        id,
        data,
        trackId
    ) {
        let valid,
            result,
            logger = Logger.create("update", trackId),
            schema = Model.Schema;

        logger.info("enter", data);

        // Validate data schema
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.TagError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data.updatedAt = moment().toISOString();

        // Try to update collection
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$set: data}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }
    }
};