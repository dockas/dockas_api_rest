let moment              = require("moment"),
    {aqlQuery}          = require("arangojs"),
    LoggerFactory       = require("common-logger"),
    Types               = require("../types");

let Logger = new LoggerFactory("tag");

/**
 * The handler class.
 */
module.exports = class RemoveHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.db = opts.db;
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

        let data = {
            deletedAt: moment().toISOString()
        };

        // Try to remove the room
        try {
            result = await this.db.query(aqlQuery`
                UPDATE ${id} WITH ${data} IN ${this.collection}
                RETURN NEW
            `);

            logger.info("collection update success", result);
        }
        catch(error) {
            logger.error("collection update error", error);

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }
    }
};
