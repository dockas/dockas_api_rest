let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    Socket              = require("utils/socket"),
    Generate            = require("utils/generate"),
    Kafka               = require("utils/kafka"),
    Types               = require("../types"),
    FindModel           = require("../find/model"),
    Model               = require("./model");

let Logger = new LoggerFactory("product");

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

            throw new Types.TagError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Regenerate nameId if name changed.
        if(data.name && !data.nameId) {
            try {
                data.nameId = await Generate.name({
                    name: data.name,
                    nameKey: "nameId",
                    collection: this.collection,
                    nameValue: lodash.kebabCase(name).replace(/-g-/, "g-").replace(/-c-/, "-")
                });

                logger.debug("generate name success", {result: data.nameId});
            }
            catch(error) {
                logger.error("generate name error", error);

                throw new Types.ProductError({
                    code: Types.ErrorCode.DB_ERROR,
                    message: error.message
                });
            }
        }

        // Add meta info
        data.updatedAt = moment().toISOString();

        if(data.validityDate) {
            data.validityDate = moment(data.validityDate).toISOString();
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

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        let updatedKeys = Object.keys(data);
        let oldData = lodash.pick(result.value, updatedKeys);
        result = FindModel.format(Object.assign({}, result.value, data));

        // Emit event to the system
        Kafka.emit("product:updated", {
            product: result,
            trackId: logger.trackId,
            oldData,
            updatedKeys
        });

        // Notify all users about the change.
        Socket.shared.emit("product:updated", {
            result,
            updatedKeys
        });

        return result;
    }
};
