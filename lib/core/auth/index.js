let Mongo           = require("common-utils/lib/mongo"),
    TokenUtil       = require("common-utils/lib/token"),
    config          = require("common-config"),
    SigninHandler   = require("./signin"),
    SignedHandler   = require("./signed"),
    SignoutHandler  = require("./signout");

/**
 * This is a service mock class.
 */
module.exports = class AuthSrv {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";
        let db = opts.db || Mongo.db;
        let collection = db.collection("users");
        let tokenUtil = opts.tokenUtil || new TokenUtil(config.auth.token);

        this.signinHandler = new SigninHandler({collection, mode, tokenUtil});
        this.signedHandler = new SignedHandler({collection, mode, tokenUtil});
        this.signoutHandler = new SignoutHandler({collection, mode, tokenUtil});
    }

    /**
     * This function signs an user into the system.
     *
     * @since 0.0.0
     *
     * @param  {string} email
     *     User email.
     * @param  {string} password
     *     User password.
     * @param  {string} trackId
     *     Hash string that tracks system requests through services.
     * @return {string}
     *     Authentication token for the user session.
     * @throws
     *     - DB_ERROR
     *     - INVALID_EMAIL_OR_PASSWORD
     *     - NOT_ACTIVATED
     */
    async signin(
        email,
        password,
        trackId
    ) {
        let token = await this.signinHandler.signin(
            email,
            password,
            trackId
        );

        return token;
    }

    /**
     * This function retrieves the check whether an user is signed in or not
     * using a provied session token.
     *
     * @since 0.0.0
     *
     * @param  {string} token
     *     Authentication session token.
     * @param  {string} trackId
     *     Hash string that tracks system requests through services.
     * @return {string}
     *     Id of the user signed in.
     * @throws
     *     - INVALID_AUTH_TOKEN
     */
    async signed(
        token,
        trackId
    ) {
        let result = await this.signedHandler.signed(
            token,
            trackId
        );

        return result;
    }

    /**
     * This function signs a user out from the system.
     *
     * @since 0.0.0
     *
     * @param  {string} token
     *     Authentication token.
     * @param  {string} trackId
     *     Hash string that tracks system requests through services.
     * @throws
     *     - DB_ERROR
     */
    async signout(
        token,
        trackId
    ) {
        await this.signoutHandler.signout(
            token,
            trackId
        );
    }
};