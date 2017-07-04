let LoggerFactory       = require("common-logger"),
    TokenUtil           = require("common-utils/lib/token"),
    config              = require("common-config"),
    comparePassword     = require("utils/compare"),
    Types               = require("../types");

let Logger = new LoggerFactory("auth");

/**
 * The handler class.
 */
module.exports = class SigninHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
        this.tokenUtil = opts.tokenUtil || new TokenUtil(config.auth.token);
    }

    /**
     * This function signs an user into the system.
     */
    async signin(
        email,
        password,
        trackId
    ) {
        // Local variables
        let user, passwordMatch, token,
            logger = Logger.create("signin", trackId);

        logger.info("enter", {
            email,
            password: Logger.secret(password)
        });

        // Try to find a user with the provided email
        try {
            user = await this.collection.findOne({email});
            logger.info("collection findOne success", user);
        }
        catch(error) {
            throw new Types.AuthError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // User not found
        if(!user) {
            logger.error("collection findOne not found");

            throw new Types.AuthError({
                code: Types.ErrorCode.INVALID_EMAIL_OR_PASSWORD,
                message: "invalid email or password"
            });
        }

        // Try to match password
        try {
            passwordMatch = await comparePassword(password, user.password);
            logger.info("comparePassword success", {match: passwordMatch});
        }
        catch(error) {
            throw new Types.AuthError({
                code: Types.ErrorCode.HASH_ERROR,
                message: error.message
            });
        }

        // Password does not match
        if(!passwordMatch) {
            logger.error("password does not match");

            throw new Types.AuthError({
                code: Types.ErrorCode.INVALID_EMAIL_OR_PASSWORD,
                message: "invalid email or password"
            });
        }

        // User is not activated.
        /*if(process.env.NODE_ENV != "test" && !user.activated) {
            logger.error("user not activated yet");

            throw new Types.AuthError({
                code: Types.ErrorCode.NOT_ACTIVATED,
                message: "activation is required"
            });
        }*/

        // Try to create an auth token
        try {
            // Create a session token for the authenticated user.
            token = await this.tokenUtil.create({
                uid: user._id.toString()
            });

            logger.info("tokenUtil create success", {
                token: Logger.secret(token)
            });
        }
        catch(error) {
            throw new Types.AuthError({
                code: Types.ErrorCode.TOKEN_ERROR,
                message: "activation is required"
            });
        }

        return token;
    }

    /**
     * This function validates an user password.
     */
    async validatePassword(
        email,
        password,
        trackId
    ) {
        // Local variables
        let user, passwordMatch, token,
            logger = Logger.create("validatePassword", trackId);

        logger.info("enter", {
            email,
            password: Logger.secret(password)
        });

        // Try to find a user with the provided email
        try {
            user = await this.collection.findOne({email});
            logger.info("collection findOne success", user);
        }
        catch(error) {
            throw new Types.AuthError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // User not found
        if(!user) {
            logger.error("collection findOne not found");

            throw new Types.AuthError({
                code: Types.ErrorCode.INVALID_EMAIL_OR_PASSWORD,
                message: "invalid email or password"
            });
        }

        // Try to match password
        try {
            passwordMatch = await comparePassword(password, user.password);
            logger.info("comparePassword success", {match: passwordMatch});
        }
        catch(error) {
            throw new Types.AuthError({
                code: Types.ErrorCode.HASH_ERROR,
                message: error.message
            });
        }

        // Password does not match
        if(!passwordMatch) {
            logger.error("password does not match");

            throw new Types.AuthError({
                code: Types.ErrorCode.INVALID_EMAIL_OR_PASSWORD,
                message: "invalid email or password"
            });
        }

        return true;
    }
};
