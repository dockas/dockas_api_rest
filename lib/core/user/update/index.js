let Joi                 = require("joi"),
    moment              = require("moment"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    hash                = require("utils/hash"),
    Socket              = require("utils/socket"),
    Types               = require("../types"),
    FindModel           = require("../find/model"),
    Model               = require("./model");

let Logger = new LoggerFactory("user");

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

        // Remove null values.
        //data = Thrift.parse(data);
        logger.info("enter", data);

        // Validate data schema
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.UserError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data = valid.value;
        data.updatedAt = moment().toISOString();

        // Process password
        if(data.password) {
            // Try to hash the password
            try{
                data.password = await hash(data.password);

                logger.debug("hash success", {
                    pasword: Logger.secret(data.password)
                });
            }
            catch(error) {
                logger.error("hash error", error);

                throw new Types.UserError({
                    code: Types.ErrorCode.HASH_ERROR,
                    message: error.message
                });
            }
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

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        result = FindModel.format(result.value);

        // Notify user and admins about the change.
        Socket.shared.emitToUsers([id], "user:updated", {
            result,
            updatedKeys: Object.keys(data)
        }, {includeRoles: ["admin"]});

        return result;
    }

    /**
     * This function add entities to arrays
     */
    async addItems(
        id, 
        data,
        trackId
    ) {
        let result,
            valid,
            logger = Logger.create("addAddress", trackId),
            schema = Model.AddSchema;

        logger.info("enter", {id, data});

        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.UserError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Set valid data.
        data = valid.value;

        // Parse to mongo query data
        let $addToSet = {};
        if(data.addresses) {$addToSet.addresses = {$each: data.addresses};}
        if(data.phones) {$addToSet.phones = {$each: data.phones};}
        if(data.lists){$addToSet.lists = {$each: data.lists};}

        // Update user
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$addToSet}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result.value);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Notify everyone about user update.
        Socket.shared.emitToUsers([id], "user:updated", {
            result: result.value,
            updatedKeys: Object.keys(data)
        }, {includeRoles: ["admin"]});

        return result.value;
    }

    /**
     * This function removes entities from arrays
     */
    async removeItems(
        id,
        data,
        trackId
    ) {
        let result,
            valid,
            logger = Logger.create("remove", trackId),
            schema = Model.AddSchema;

        logger.info("enter", {id, data});

        // Validate data
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.UserError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Parse to mongo query data
        let $pull = {};
        if(data.addresses) {$pull.addresses = {id: {$in: data.addresses}};}
        if(data.phones){$pull.phones = {$in: data.phones};}
        if(data.lists){$pull.lists = {$in: data.lists};}

        // Update user
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$pull}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Notify everyone about user update.
        Socket.shared.emitToUsers([id], "user:updated", {
            result: result.value,
            updatedKeys: Object.keys(data)
        }, {includeRoles: ["admin"]});

        return result.value;
    }
};
