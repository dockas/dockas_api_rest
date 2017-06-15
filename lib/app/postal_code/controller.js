let lodash          = require("lodash"),
    LoggerFactory   = require("common-logger"),
    PostalCodeSrv   = require("services/postal_code");

// Instantiate the logger factory.
let Logger = new LoggerFactory("postal_code.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    /**
     * This function find generic records in the system.
     *
     * @TODO : non admin user can search only within it's
     * own orders.
     */
    static async findAddress(req, res) {
        let result,
            logger = Logger.create("findAddress", req.trackId);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            result = await PostalCodeSrv.client.findAddress(
                req.params.code,
                req.query.country_code,
                logger.trackId
            );

            logger.info("postal_code service findAddress success", result);
        }
        catch(error) {
            logger.error("postal_code service findAddress error", error);
            return res.serverError(error);
        }

        res.success(result);
    }
};
