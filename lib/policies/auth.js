/**
 * This module is responsible for authentication policy middleware.
 *
 * @module
 *     policies/auth
 * @copyright
 *     Bruno Fonseca
 */
let AuthSrv         = require("services/auth"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("policies.auth");

module.exports = function(req, res, next) {
    let logger = Logger.create("middleware", req.trackId);
    logger.info("enter", {
        token: Logger.secret(req.token)
    });

    AuthSrv.client.signed(req.token, req.trackId).then((uid) => {
        logger.info(`user authenticated as ${uid}`);

        req.uid = uid;
        next();
    })
    .catch(() => {
        res.unauthorized("You are not authenticated!");
    });
};
