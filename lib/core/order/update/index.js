let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Kafka               = require("utils/kafka"),
    Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("order");

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

            throw new Types.OrderError({
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

            throw new Types.OrderError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }
    }

    async updateStatus(
        id,
        status,
        preventAlert,
        trackId
    ) {
        let valid,
            result,
            data = {status},
            logger = Logger.create("update", trackId),
            schema = Model.UpdateStatusSchema;

        logger.info("enter", {id, status});

        // Validate data schema
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.OrderError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Update the order status.
        data.statusUpdatedAt = moment().toISOString();

        // Try to update collection
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$set: data}, {returnOriginal: true});

            logger.info("collection findOneAndUpdate success", result);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.OrderError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Notify user and admin about this status update.
        Socket.shared.emitToUsers([result.value.user], "order:status_updated", {
            order: result.value,
            updated: {status}
        }, {
            includeRoles: ["admin"]
        });

        // Prevent alert to user
        if(preventAlert) { return; }

        // Alert the user
        let alert = Object.assign({
            users: [result.value.user],
            type: "ORDER_STATUS_UPDATED",
            message: (`_ALERT_MESSAGE_ORDER_STATUS_UPDATED_TO_${status}_`).toUpperCase(),
            data: {
                order: result.value,
                updated: {status}
            },
            options: []
        }, lodash.get(config, `alerts.orderStatusUpdated.${result.value.status}__${status}`));

        logger.debug("alert", alert);

        // Emit alert
        Kafka.emit("alert:create", alert);
    }
};
