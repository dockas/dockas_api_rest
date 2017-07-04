let lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Types               = require("../../../types");

let Logger = new LoggerFactory("billing.adaptors.moip.charge");

module.exports = class MoipChargeHandler {
    constructor(opts = {}) {
        this.api = opts.api;
    }

    /**
     * This function creates a charge in Moip. Charge in Moip
     * term is knwon as "Pagamento" and are hard associated with 
     * an order.
     */
    async create(
        data,
        trackId
    ) {
        let result,
            logger = Logger.create("create", trackId);
        
        logger.info("enter", data);

        // If charge is not assotiated with an order,
        // then return an error.
        if(!data.order) {
            throw new Types.BillingError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: "order is required"
            });
        }

        let moipData = {
            fundingInstrument: {}
        };

        switch(data.source.method) {
            case "credit_card": {
                moipData.fundingInstrument.method = "CREDIT_CARD";
                moipData.fundingInstrument.creditCard = {
                    id: lodash.get(data, "source._id"),
                    cvc: lodash.get(data,"source.hash.cvc")
                };
                break;
            }

            case "bank_slip": {
                moipData.fundingInstrument.method = "BOLETO";
                break;
            }

            default: {break;}
        }

        logger.debug("moipData", moipData);

        try {
            result = await this.api.orderPay(data.order, moipData);
            logger.info("api orderPay success", result);
        }
        catch(error) {
            logger.error("api orderPay error", error);
            throw error;
        }

        let normalizedResult = {
            _id: result.id,
            order: data.order,
            status: result.status,
            total: result.total
        };

        logger.debug("normalizedResult", normalizedResult);

        // Return normalized result
        return normalizedResult;
    }

    /**
     * This function find a charge by it's id.
     */
    async findById(
        id,
        trackId
    ) {
        let result,
            logger = Logger.create("create", trackId);
        
        logger.info("enter", {id});

        try {
            result = await this.api.paymentFindById(id);
            logger.info("api paymentFindById success", result);
        }
        catch(error) {
            logger.error("api orderPay error", error);
            throw error;
        }

        let normalizedResult = {
            _id: result.id,
            status: result.status,
            events: result.events,
            total: result.amount.total
        };

        logger.debug("normalizedResult", normalizedResult);

        // Return normalized result
        return normalizedResult;
    }
};