let BillingSrv      = require("services/billing"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("billing.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    /**
     * This function adds a credit card to an user profile.
     */
    static async sourceAdd(req, res) {
        let result,
            logger = Logger.create("sourceAdd");

        logger.info("enter", Logger.secret(req.body));

        try {
            result = await BillingSrv.client.sourceCreate(
                Object.assign({}, req.body, {
                    customer: req.user.billingCustomer
                })
            );

            logger.info("billing service sourceCreate success", result);
        }
        catch(error) {
            logger.error("billing service sourceCreate error", error);
            return res.serverError(error);
        }

        res.success(result);
    }
    
    /**
     * This function removes a credit cards.
     */
    static async sourceRemove(req, res) {
        let result,
            logger = Logger.create("sourceRemove");

        logger.info("enter", {id: req.params.id});

        try {
            result = await BillingSrv.client.sourceRemove(
                req.params.id,
                req.user.billingCustomer,
                logger.trackId
            );

            logger.info("billing service sourceRemove success", result);
        }
        catch(error) {
            logger.error("billing service sourceRemove error", error);
            return res.serverError(error);
        }

        res.success(true);
    }
};
