/**
 * This module is responsible for admin role policy middleware.
 *
 * @module
 *     policies/profile
 * @copyright
 *     Bruno Fonseca
 */
let UserSrv         = require("services/user"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("policies.user");

module.exports = async function(req, res, next) {
    let logger = Logger.create("middleware", req.trackId);
    
    logger.info("enter", {
        token: Logger.secret(req.token)
    });

    try {
        let user = await UserSrv.client.findById(req.uid, req.trackId);
        logger.debug("user service findById success", user);

        req.user = user;

        next();
    }
    catch(error) {
        logger.error("user service findById error", error);
        res.unauthorized("user not found");
    }
};
