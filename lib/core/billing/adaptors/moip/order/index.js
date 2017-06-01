let LoggerFactory       = require("common-logger");

let Logger = new LoggerFactory("billing.adaptors.moip.order");

module.exports = class MoipOrderHandler {
    constructor(opts = {}) {
        this.api = opts.api;
    }

    /**
     * This function creates an order
     */
    async create(
        data,
        trackId
    ) {
        let result,
            logger = Logger.create("create", trackId);

        logger.info("enter", data);

        let moipOrder = {
            ownId: data._id,
            customer: {
                id: data.customer
            },
            items: []
        };

        for(let item of data.items) {
            moipOrder.items.push({
                product: item.product,
                quantity: item.quantity,
                price: item.price
            });
        }

        logger.debug("moipOrder", moipOrder);

        try {
            result = await this.api.orderCreate(moipOrder);
            logger.info("api orderCreate success", result);
        }
        catch(error) {
            logger.error("api orderCreate error", error);

            // @TODO : Handle and normalize moip error codes.
            throw error;
        }

        let normalizedResult = {
            _id: result.id,
            order: data._id,
            status: result.status
        };

        logger.debug("normalizedResult", normalizedResult);

        return normalizedResult;
    }
};