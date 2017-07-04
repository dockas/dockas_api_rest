let lodash              = require("lodash"),
    LoggerFactory       = require("common-logger");

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

        if(!data.postalCodeAddress) {
            throw "postalCodeAddress address is requied for moip";
        }

        // Generate random streetNumber :)
        // Fuck it Moip!!
        let min = 10;
        let max = 1000;
        let streetNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        let moipCustomer = {
            ownId: data._id,
            fullname: data.fullName,
            email: data.email,
            shippingAddress: {
                street: lodash.deburr(data.postalCodeAddress.street),
                streetNumber: streetNumber,
                complement: data.postalCodeAddress.complement,
                zipCode: data.postalCodeAddress.postalCode,
                district: lodash.deburr(data.postalCodeAddress.neighborhood),
                city: lodash.deburr(data.postalCodeAddress.city),
                state: data.postalCodeAddress.state,
                country: data.postalCodeAddress.country
            }
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