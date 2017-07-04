let Joi                 = require("joi"),
    moment              = require("moment"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    Socket              = require("utils/socket"),
    Types               = require("../types"),
    Utils               = require("../utils"),
    FindModel           = require("../find/model"),
    Model               = require("./model");

let Logger = new LoggerFactory("list.subscription");

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

            throw new Types.ListSubscriptionError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data.updatedAt = moment().toISOString();

        // Validate next deliver date
        if(data.nextDeliverDate) {
            data.nextDeliverDate = moment(data.nextDeliverDate).toISOString();

            if(!Utils.isValidNextDeliverDate(data.nextDeliverDate)) {
                logger.error("invalid next deliver date");

                throw new Types.ListSubscriptionError({
                    code: Types.ErrorCode.INVALID_NEXT_DELIVER_DATE,
                    message: "invalid next deliver date"
                });
            }
        }

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

            throw new Types.ListSubscriptionError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        result = FindModel.format(result.value);

        // Notify subscription user.
        Socket.shared.emitToUsers(result.user, "list_subscription:updated", {
            result,
            updatedKeys: Object.keys(data)
        });

        return result;
    }

    async updateNextDeliverDate(
        id,
        trackId
    ) {
        let result,
            subscription,
            logger = Logger.create("updateNextDeliverDate", trackId);

        logger.info("enter", {id});

        // First, try to find the subscription by it's id.
        try {
            subscription = await this.collection.findOne({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            });

            logger.debug("collection findOne success", subscription);
        }
        catch(error) {
            logger.error("collection findOne error", error);

            throw new Types.ListSubscriptionError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Subscription not found
        if(!subscription) {
            logger.error("collection findOne not found");

            throw new Types.ListSubscriptionError({
                code: Types.ErrorCode.NOT_FOUND,
                message: "tag not found"
            });
        }

        // Data to update
        let data = {};

        // Now find the next deliver date starting from the 
        // current nextDeliverDate.
        data.nextDeliverDate = Utils.getNextDeliverDate(subscription);

        // Add meta info
        data.updatedAt = moment().toISOString();

        logger.debug("data to update", data);

        // Update the subscription
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

            throw new Types.ListSubscriptionError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        result = FindModel.format(result.value);

        // Notify subscription user.
        Socket.shared.emitToUsers(result.user, "list_subscription:updated", {
            result,
            updatedKeys: Object.keys(data)
        });

        return result;
    }
};
