let Joi                 = require("joi"),
    moment              = require("moment"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model"),
    FindModel           = require("../find/model");

let Logger = new LoggerFactory("coupon");

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

            throw new Types.CouponError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data.updatedAt = moment().toISOString();

        if(data.status && data.status == Types.STATUS_VIEWED) {
            data.viewedAt = moment().toISOString();
        }

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

            throw new Types.CouponError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Notify alert users and admins.
        /*Socket.shared.emitToUsers(result.value.users, "alert:updated", {
            alert: result.value,
            updated: data
        }, {
            includeRoles: ["admin"]
        });*/

        return FindModel.format(result.value);
    }

    async apply(
        id,
        uid,
        trackId
    ) {
        let result,
            logger = Logger.create("apply", trackId);

        logger.info("enter", {id, uid});

        // Try to update collection
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$addToSet: {appliers: uid}}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.CouponError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Notify alert users and admins.
        /*Socket.shared.emitToUsers(result.value.users, "alert:updated", {
            alert: result.value,
            updated: data
        }, {
            includeRoles: ["admin"]
        });*/

        return FindModel.format(result.value);
    }

    async applyByNameId(
        nameId,
        uid,
        trackId
    ) {
        let result,
            logger = Logger.create("applyByNameId", trackId);

        logger.info("enter", {nameId, uid});

        // Try to update collection
        try {
            result = await this.collection.findOneAndUpdate({
                nameId,
                deletedAt: {$type: "null"}
            }, {$addToSet: {appliers: uid}}, {returnOriginal: true});

            logger.info("collection findOneAndUpdate success", result);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.CouponError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Record not found
        if(!result.value) {
            logger.error("collection findOne not found");

            throw new Types.CouponError({
                code: Types.ErrorCode.NOT_FOUND,
                message: "tag not found"
            });
        }

        // Check if uid was already among appliers.
        if(result.value.appliers.indexOf(uid) >= 0) {
            logger.error("already applied by user");

            throw new Types.CouponError({
                code: Types.ErrorCode.ALREADY_APPLIED,
                message: "coupon already applied by this user"
            });
        }

        // Update appliers
        result.value.appliers.push(uid);

        // Notify alert users and admins.
        /*Socket.shared.emitToUsers(result.value.users, "alert:updated", {
            alert: result.value,
            updated: data
        }, {
            includeRoles: ["admin"]
        });*/

        return FindModel.format(result.value);
    }
};
