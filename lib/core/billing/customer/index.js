let LoggerFactory       = require("common-logger"),
    Kafka               = require("utils/kafka");

let Logger = new LoggerFactory("billing.customer");

/**
 * The handler class.
 */
module.exports = class CustomerHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.adaptor = opts.adaptor;
    }

    /**
     * This function creates a new client on payment gateway.
     */
    async create(
        data,
        trackId
    ) {
        // Local variables
        let result,
            logger = Logger.create("create", trackId);

        logger.info("enter", {data});

        // Create customer on moip.
        try {
            result = await this.adaptor.customerCreate(data);
            logger.info("adaptor customerCreate success", {result});
        }
        catch(error) {
            logger.error("adaptor customerCreate error", error);
            throw error;
        }

        // Emit event
        Kafka.emit("billing:customer:created", {
            billingCustomer: result,
            trackId: logger.trackId
        });

        // Return notification id.
        return result;
    }
};
