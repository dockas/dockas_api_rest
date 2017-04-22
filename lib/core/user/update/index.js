let Joi                 = require("joi"),
    moment              = require("moment"),
    crypto              = require("crypto"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    hash                = require("utils/hash"),
    Types               = require("../types"),
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
            user,
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
            user = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$set: data}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", user);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }
    }

    /**
     * This function add an address to user profile.
     */
    async addAddress(
        id,
        address,
        trackId
    ) {
        let user,
            valid,
            logger = Logger.create("addAddress", trackId),
            schema = Model.AddressSchema;

        logger.info("enter", {id,address});

        valid = Joi.validate(address, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.UserError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Generate unique address id.
        address.id = crypto.randomBytes(20).toString("hex");

        // Update user
        try {
            user = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$push: {addresses: address}}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", user);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        return address.id;
    }

    /**
     * This function removes an address from user profile.
     */
    async removeAddress(
        id,
        addressId,
        trackId
    ) {
        let user,
            logger = Logger.create("addAddress", trackId);

        logger.info("enter", {id,addressId});

        // Update user
        try {
            user = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$pull: {addresses: {id: addressId}}}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", user);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }
    }
};
