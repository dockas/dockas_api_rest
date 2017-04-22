let moment              = require("moment"),
    Mongo               = require("common-utils/lib/mongo"),
    LoggerFactory       = require("common-logger"),
    Types               = require("../types");

let Logger = new LoggerFactory("price");

/**
 * The handler class.
 */
module.exports = class RemoveHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
    }

    /**
     * This is the main handler function.
     */
    async remove(
        id,
        trackId
    ) {
        // Local variables
        let result,
            logger = Logger.create("remove", trackId);

        logger.info("enter", {id: id});

        // Try to remove the room
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(id),
                deletedAt: {$type: "null"}
            }, {$set: {deletedAt: moment().toISOString()}}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }
    }
};
