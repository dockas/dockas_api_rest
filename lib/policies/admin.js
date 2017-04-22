/**
 * This module is responsible for admin role policy middleware.
 *
 * @module
 *     policies/admin
 * @copyright
 *     Bruno Fonseca
 */
let UserSrv         = require("services/user"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("policies.admin");

module.exports = async function(req, res, next) {
    let failMsg = "Only admins allowed",
        logger = Logger.create("middleware", req.trackId);
    
    logger.info("enter", {
        token: Logger.secret(req.token)
    });

    try {
        let user = await UserSrv.client.findById(req.uid, req.trackId);
        logger.debug("user service findById success", user);

        if(user.roles.indexOf(UserSrv.types.ROLE_ADMIN) < 0 ) {throw "unauthorized";}
        else if(next) {next();}
        else {return true;}
    }
    catch(error) {
        res.unauthorized(failMsg);
        if(!next) {return false;}
    }
};
