let LoggerFactory       = require("common-logger"),
    Types               = require("../types");

let Logger = new LoggerFactory("check");

/**
 * The handler class.
 */
module.exports = class CheckHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
    }

    /**
     * This function check if nickName is available.
     */
    async isEmailAvailable(
        email,
        trackId
    ) {
        let user,
            logger = Logger.create("isEmailAvailable", trackId);

        logger.info("enter", {email});

        try {
            user = await this.collection.findOne({email});
        }
        catch(error) {
            logger.error("collection findOne error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        logger.info("collection findOne success", user);

        // No user was found, so email is available
        if(!user) { return true; }

        // User was found, so email is unavailable.
        return false;
    }
};
