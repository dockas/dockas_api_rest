let LoggerFactory       = require("common-logger"),
    TokenUtil           = require("common-utils/lib/token"),
    config              = require("common-config"),
    Types               = require("../types");

let Logger = new LoggerFactory("auth");

/**
 * The handler class.
 */
module.exports = class SignedHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
        this.tokenUtil = opts.tokenUtil || new TokenUtil(config.auth.token);
    }

    /**
     * This function check if an user is signed into the system.
     */
    async signed(
        token,
        trackId
    ) {
        let decoded,
            logger = Logger.create("signed", trackId);

        logger.info("enter", {
            token: Logger.secret(token)
        });

        try {
            decoded = await this.tokenUtil.decode(token);
            logger.info("tokenUtil decode success", decoded);
        }
        catch(error) {
            logger.error("tokenUtil decode error", error);

            throw new Types.AuthError({
                code: Types.ErrorCode.INVALID_AUTH_TOKEN,
                message: error.message
            });
        }

        return decoded.uid;
    }
};
