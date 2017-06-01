let LoggerFactory       = require("common-logger");

let Logger = new LoggerFactory("billing.adaptors.moip.customer");

module.exports = class MoipCustomerHandler {
    constructor(opts = {}) {
        this.api = opts.api;
    }

    /**
     * This function creates a customer
     */
    async create(
        data,
        trackId
    ) {
        let result,
            logger = Logger.create("create", trackId);

        logger.info("enter", data);

        let moipCustomer = {
            ownId: data._id,
            fullname: data.fullName,
            email: data.email
        };

        logger.debug("moipCustomer", moipCustomer);

        try {
            result = await this.api.customerCreate(moipCustomer);
            logger.info("api customerCreate success", result);
        }
        catch(error) {
            logger.error("api customerCreate error", error);

            // @TODO : Handle and normalize moip error codes.
            throw error;
        }

        let normalizedResult = {
            _id: result.id,
            user: data._id
        };

        logger.debug("normalizedResult", normalizedResult);

        return normalizedResult;
    }
};