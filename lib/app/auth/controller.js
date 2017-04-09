let AuthSrv         = require("services/auth"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("auth.ctrl");

/**
 * Auth controller class definition.
 */
module.exports = class AuthCtrl {

    /**
     * This function signs an user into the system.
     */
    static async signin(req, res) {
        // Local variables
        let token,
            logger = Logger.create("signin", req.trackId);

        logger.info("enter", {
            nickOrEmail: req.body.nickOrEmail,
            password: Logger.secret(req.body.password)
        });

        // Try to sign user into the system.
        try {
            token = await AuthSrv.client.signin(
                req.body.nickOrEmail,
                req.body.password,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("auth service signin error", error);
            return res.serverError(error);
        }

        logger.info("auth service signin success", {
            token: Logger.secret(token)
        });

        res.success(token);
    }

    /**
     * This function checks if user is currently signed into the system.
     */
    static async signed(req, res) {
        // Local variables
        let uid,
            failMsg = "You are not logged",
            logger = Logger.create("signed", req.trackId);

        logger.info("enter", {
            token: Logger.secret(req.token)
        });

        // Try to check if user is signed into the system.
        try {
            uid = await AuthSrv.client.signed(
                req.token,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("auth service signed error", error);
            return res.success({message: failMsg, ok: 0});
        }

        logger.info("auth service signed success", {
            uid: uid
        });

        if(!uid) { return res.success({message: failMsg, ok: 0}); }

        res.success({message: `You are logged as ${uid}`, ok: 1});
    }

    /**
     * This function signs a user out from the system.
     */
    static async signout(req, res) {
        let result,
            logger = Logger.create("signout", req.trackId);

        logger.info("enter");

        // Try to sign user out from the system.
        try {
            result = await AuthSrv.client.signout(
                req.token,
                logger.trackId
            );

            logger.debug("auth service signout success", result);
        }
        catch(error) {
            logger.error("auth service signout error", error);
            return res.serverError(error);
        }

        res.success("logout success");
    }
};
