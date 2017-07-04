let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    Socket              = require("utils/socket"),
    Generate            = require("utils/generate"),
    Types               = require("../types"),
    Model               = require("./model"),
    FindModel           = require("../find/model");

let Logger = new LoggerFactory("list");

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

            throw new Types.ListError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data.updatedAt = moment().toISOString();

        // Generate a nameId if name changed
        if(data.name && !data.nameId) {
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

            throw new Types.ListError({
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

        result = FindModel.format(result.value);

        // Notify all list owners about the change.
        Socket.shared.emitToUsers(
            lodash.map(result.owners, "user"),
            "list:updated", 
            {
                result,
                updatedKeys: Object.keys(data)
            }
        );

        return result;
    }

    /**
     * This function update a list item quantity.
     */
    async updateItem(
        id,
        productId,
        data,
        trackId
    ) {
        let list,
            result,
            valid,
            schema = Model.ItemSchema,
            logger = Logger.create("updateItem", trackId);

        // Validate data
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.ListError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Set data as valid result.
        data = valid.value;

        // Try to find the record
        try {
            list = await this.collection.findOne({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            });
        }
        catch(error) {
            logger.error("collection findOne error", error);

            throw new Types.ListError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Record not found
        if(!list) {
            logger.error("collection findOne not found");

            throw new Types.ListError({
                code: Types.ErrorCode.NOT_FOUND,
                message: "list not found"
            });
        }

        // Find item index
        let itemIdx = lodash.findIndex(list.items, (item) => {
            return item.product == productId;
        });

        // Item not found, let's insert it.
        if(itemIdx < 0) {
            logger.error("item not found");

            if(data.quantity <= 0) {
                throw new Types.ListError({
                    code: Types.ErrorCode.ITEM_NOT_FOUND,
                    message: "item not found"
                });
            }

            list.items.push(lodash.assign({}, data, {
                product: productId
            }));
        }
        // Remove existing item
        else if(data.quantity <= 0) {
            list.items.splice(itemIdx, 1);
        }
        // Update item.
        else {
            list.items[itemIdx] = lodash.assign(
                {}, 
                list.items[itemIdx], 
                data
            );
        }

        // Update list.
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$set: {items: list.items}}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result.value);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.ListError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        result = FindModel.format(result.value);

        // Notify all list owners about the change.
        Socket.shared.emitToUsers(
            lodash.map(result.owners, "user"),
            "list:item:updated", 
            {
                result,
                product: productId,
                updatedKeys: Object.keys(data)
            }
        );

        return result;
    }
};
