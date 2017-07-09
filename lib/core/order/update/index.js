let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Kafka               = require("utils/kafka"),
    Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model"),
    FindModel           = require("../find/model");

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

            throw new Types.OrderError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        return FindModel.format(result.value);
    }

    async updateStatus(
        id,
        status,
        preventNotification,
        trackId
    ) {
        let valid,
            result,
            data = {status},
            logger = Logger.create("updateStatus", trackId),
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
        data = valid.value;
        data.statusPriority = Types.StatusPriority.indexOf(data.status);
        data.statusUpdatedAt = moment().toISOString();

        // Try to update collection
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$set: data}, {returnOriginal: true});

            logger.info("collection findOneAndUpdate success", result.value);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.OrderError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Notify the user
        if(!preventNotification) {
            // Notify user and admin about this status update.
            Socket.shared.emitToUsers([result.value.user], "order:updated", {
                result: Object.assign({}, result.value, data),
                updatedKeys: Object.keys(data)
            }, {
                includeRoles: ["admin"]
            });

            let notification = Object.assign({
                users: [result.value.user],
                type: "ORDER_STATUS_UPDATED",
                message: (`_NOTIFICATION_MESSAGE_ORDER_STATUS_UPDATED_TO_${status}_`).toUpperCase(),
                data: {
                    result: Object.assign({}, result.value, data),
                    updatedKeys: ["status"]
                },
                options: []
            }, lodash.get(config, `notifications.orderStatusUpdated.${result.value.status}__${status}`));

            logger.debug("notification alert", notification);

            // Emit notification
            Kafka.emit("notification:alert:create", {
                trackId: logger.trackId,
                body: notification
            });
        }

        // Format result
        result = FindModel.format(Object.assign({}, result.value, data));
        logger.debug("formatted result", result);

        // Return new value to caller.
        return result;
    }

    /**
     * This function updates an order item status.
     */
    async updateItemStatus(
        id,
        itemProduct,
        status,
        trackId
    ) {
        let valid,
            result,
            order,
            data = {status},
            logger = Logger.create("updateItemStatus", trackId),
            schema = Model.UpdateItemStatusSchema;

        logger.info("enter", {id,itemProduct,status});

        // Validate data schema
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.OrderError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Try to find the order
        try {
            order = await this.collection.findOne({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            });
        }
        catch(error) {
            throw new Types.OrderError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Order not found
        if(!order) {
            logger.error("collection findOne not found");

            throw new Types.OrderError({
                code: Types.ErrorCode.NOT_FOUND,
                message: "order not found"
            });
        }

        // Now let's find an item assotiated with the product.
        let itemIdx = lodash.findIndex(order.items, (item) => {
            return item.product == itemProduct;
        });

        // No item found
        if(itemIdx < 0) {
            throw new Types.OrderError({
                code: Types.ErrorCode.ITEM_NOT_FOUND,
                message: "item not found"
            });
        }

        let item = order.items[itemIdx];

        // If item is already in that status, then return.
        if(item.status == data.status) { return order; }

        // Now we can update item status.
        item.status = data.status;
        item.statusUpdatedAt = moment().toISOString();

        // Try to update collection
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$set: {items: order.items}}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result.value);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.OrderError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Notify user and admin about this status update.
        Socket.shared.emitToUsers([result.value.user], "order:updated", {
            result: result.value,
            updatedKeys: [`items[${itemIdx}].status`]
        }, {
            includeRoles: ["admin"]
        });

        // Emit to system
        Kafka.emit("order:item_status:updated", {
            trackId: logger.trackId,
            body: {
                data: result.value,
                item
            }
        });

        // Format result
        result = FindModel.format(result.value);
        logger.debug("formatted result", result);

        // Return new value to caller.
        return result;
    }
};
