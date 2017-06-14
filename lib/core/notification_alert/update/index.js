let Joi                 = require("joi"),
    moment              = require("moment"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model"),
    FindModel           = require("../find/model");

let Logger = new LoggerFactory("notification_alert");

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

            throw new Types.NotificationAlertError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data = valid.value;
        data.updatedAt = moment().toISOString();

        if(data.status && data.status == Types.Status.VIEWED) {
            data.viewedAt = moment().toISOString();
        }

        // Try to update collection
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$set: data}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result.value);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.NotificationAlertError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        result = FindModel.format(result.value);

        // Notify users and admins.
        Socket.shared.emitToUsers(result.users, "notification:alert:updated", {
            result,
            updatedKeys: Object.keys(data)
        }, {
            includeRoles: ["admin"]
        });

        return result;
    }
};
