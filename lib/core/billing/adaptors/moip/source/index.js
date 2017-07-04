let lodash              = require("lodash"),
    moment              = require("moment"),
    LoggerFactory       = require("common-logger");

let Logger = new LoggerFactory("billing.adaptors.moip.source");

module.exports = class MoipSourceHandler {
    constructor(opts = {}) {
        this.api = opts.api;
    }

    /**
     * This function creates an order
     */
    async create(
        source,
        trackId
    ) {
        let result,
            logger = Logger.create("create", trackId);

        logger.info("enter", source);

        let moipFundingInstrument = {
            method: source.method.toUpperCase()
        };

        switch(source.method) {
            case "credit_card": {
                moipFundingInstrument.creditCard = {
                    expirationMonth: lodash.get(source, "data.expMonth"),
                    expirationYear: lodash.get(source, "data.expYear"),
                    number: lodash.get(source, "data.number"),
                    cvc: lodash.get(source, "data.cvc"),
                    holder: {
                        fullname: lodash.get(source, "data.holder.fullname"),
                        phone: lodash.get(source, "data.holder.phone"),
                        birthdate: moment(lodash.get(source,"data.holder.birthdate")).format("YYYY-MM-DD"),
                        taxDocument: {
                            type: (lodash.get(source, "data.holder.document.type")||"").toUpperCase(),
                            number: lodash.get(source, "data.holder.document.number")
                        }
                    }
                };

                break;
            }
            default: {break;}
        }

        logger.debug("moipFundingInstrument", moipFundingInstrument);

        try {
            result = await this.api.customerFundingInstrumentAdd(source.customer, moipFundingInstrument);
            logger.info("api customerFundingInstrumentAdd success", result);
        }
        catch(error) {
            logger.error("api customerFundingInstrumentAdd error", error);

            // @TODO : Handle and normalize moip error codes.
            throw error;
        }

        // Normalize result.
        let normalizedResult = {
            customer: source.customer,
            method: source.method
        };

        switch(source.method) {
            case "credit_card": {
                normalizedResult._id = result.creditCard.id;
                normalizedResult.brand = result.creditCard.brand;
                normalizedResult.lastDigits = result.creditCard.last4;
                break;
            }

            default: {break;}
        }

        logger.debug("normalizedResult", normalizedResult);

        // Return
        return normalizedResult;
    }

    /**
     * This function remove a payment source.
     */
    async remove(
        id,
        trackId
    ) {
        let result,
            logger = Logger.create("remove", trackId);

        logger.info("enter", {id});

        try {
            result = await this.api.customerFundingInstrumentRemove(id);
            logger.info("api customerFundingInstrumentRemove success", result);
        }
        catch(error) {
            logger.error("api customerFundingInstrumentRemove error", error);

            // @TODO : Handle and normalize moip error codes.
            throw error;
        }
    }
};