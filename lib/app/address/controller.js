let LoggerFactory   = require("common-logger"),
    AddressSrv      = require("services/address");

// Instantiate the logger factory.
let Logger = new LoggerFactory("address.ctrl");

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
    static async findByPostalCode(req, res) {
        let result,
            logger = Logger.create("findByPostalCode", req.trackId);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            result = await AddressSrv.client.findByPostalCode(
                req.params.code,
                req.query.countryCode,
                logger.trackId
            );

            logger.info("address service findByPostalCode success", result);
        }
        catch(error) {
            logger.error("address service findByPostalCode error", error);
            return res.serverError(error);
        }

        res.success(result);
    }
};
