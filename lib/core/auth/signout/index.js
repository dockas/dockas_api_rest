let LoggerFactory       = require("common-logger"),
    TokenUtil           = require("common-utils/lib/token"),
    config              = require("common-config"),
    Types               = require("../types");

let Logger = new LoggerFactory("auth");

/**
 * The handler class.
 */
module.exports = class SignoutHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
        this.tokenUtil = opts.tokenUtil || new TokenUtil(config.auth.token);
    }

    /**
     * This function signs an user out from the system.
     */
    async signout(
        token,
        trackId
    ) {
        // Local variables
        let result,
            logger = Logger.create("signout");

        logger.info("enter", {
            token: Logger.secret(token)
        });

        // Try to expire the token
        try {
            result = this.tokenUtil.expire(token, trackId);
            logger.info("tokenUtil expire success", result);
        }
        catch(error) {
            logger.error("tokenUtil expire error", error);

            throw new Types.AuthError({
                code: Types.ErrorCode.TOKEN_ERROR,
                message: error.message
            });
        }
    }
};
