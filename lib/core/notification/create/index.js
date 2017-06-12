let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("notification");

/**
 * The handler class.
 */
module.exports = class CreateHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
    }

    /**
     * This function creates a new entity.
     */
    async create(
        data,
        trackId
    ) {
        // Local variables
        let valid,
            result,
            logger = Logger.create("create", trackId),
            schema = Model.Schema;

        logger.info("enter", {data: data});

        // Validate data schema
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.NotificationError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta infos
        data = valid.value;
        data.createdAt = moment().toISOString();
        data.deletedAt = null;
        data.status = Types.Status.NEW;

        logger.info("valid data", {data});

        // Try to insert to collection
        try {
            result = await this.collection.insertOne(data);
            logger.info("collection insertOne success", {id: result.insertedId});
        }
        catch(error) {
            logger.error("collection insertOne error", error);

            throw new Types.NotificationError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Emit notification to users.
        Socket.shared.emitToUsers(data.users, "notification:created", Object.assign(data, {_id: result.insertedId}));

        // Return notification id.
        return lodash.toString(result.insertedId);
    }
};
