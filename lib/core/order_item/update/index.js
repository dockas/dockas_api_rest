let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    Kafka               = require("utils/kafka"),
    //Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model"),
    FindModel           = require("../find/model");

let Logger = new LoggerFactory("order_item");

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

            throw new Types.ProductSellError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data.updatedAt = moment().toISOString();

        // Set statusPriority
        if(data.status) { data.statusPriority = Types.StatusPriority.indexOf(data.status); }

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

            throw new Types.ProductSellError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }


        console.log("##################################");
        console.log(result);

        // Notify alert users and admins.
        /*Socket.shared.emitToUsers(result.value.users, "alert:updated", {
            alert: result.value,
            updated: data
        }, {
            includeRoles: ["admin"]
        });*/

        let updatedKeys = Object.keys(data);
        let oldData = lodash.pick(result.value, updatedKeys);
        result = FindModel.format(Object.assign({}, result.value, data));

        // Let's emit updated event
        Kafka.emit("order_item:updated", {
            orderItem: result,
            oldData,
            updatedKeys
        });

        // Notify all users about the change.
        /*Socket.shared.emit("product_sell:updated", {
            result,
            oldData,
            updatedKeys
        });*/

        return result;
    }
};
