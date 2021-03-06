/**
 * This module is responsible for admin role policy middleware.
 *
 * @module
 *     policies/admin
 * @copyright
 *     Bruno Fonseca
 */
let UserSrv         = require("services/user"),
    LoggerFactory   = require("common-logger"),
    Types           = require("types");

// Instantiate the logger factory.
let Logger = new LoggerFactory("policies.admin");

module.exports = async function(req, res, next) {
    let logger = Logger.create("middleware", req.trackId);
    
    logger.info("enter", {
        token: Logger.secret(req.token)
    });

    try {
        let user = await UserSrv.client.findById(req.uid, req.trackId);
        logger.debug("user service findById success", user);

        if(user.roles.indexOf(UserSrv.types.Role.ADMIN) < 0 ) {throw "unauthorized";}
        else if(next) {next();}
        else {return true;}
    }
    catch(error) {
        res.unauthorized(
            new Types.ApiError({
                code: Types.ErrorCode.ONLY_ADMINS_ALLOWED,
                message: "you must be an admin to perform this request"
            })
        );

        if(!next) {return false;}
    }
};
