let Joi                 = require("joi"),
    moment              = require("moment"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model"),
    FindModel           = require("../find/model");

let Logger = new LoggerFactory("wallet");

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

            throw new Types.WalletError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data = valid.value;
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

            throw new Types.WalletError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        result = FindModel.format(result.value);

        // Notify all users about the update.
        if(result.users) {
            Socket.shared.emitToUsers(result.users, "wallet:updated", {
                result,
                updatedKeys: Object.keys(data)
            });
        }

        return result;
    }
};
