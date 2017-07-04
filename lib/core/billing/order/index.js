let Joi                 = require("joi"),
    LoggerFactory       = require("common-logger"),
    Kafka               = require("utils/kafka"),
    Model               = require("./model"),
    Types               = require("../types");

let Logger = new LoggerFactory("billing.order");

/**
 * The handler class.
 */
module.exports = class OrderHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.adaptor = opts.adaptor;
    }

    /**
     * This function creates a new order on payment gateway.
     */
    async create(
        data,
        trackId
    ) {
        // Local variables
        let valid,
            result,
            logger = Logger.create("create", trackId),
            schema = Model.Schema;

        logger.info("enter", data);

        // Validate data schema
        valid = Joi.validate(data, schema);
        data = valid.value;

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.BillingError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        logger.debug("valid data", {data});

        // Create order through adaptor.
        try {
            result = await this.adaptor.orderCreate(data);
            logger.info("adaptor orderCreate success", result);
        }
        catch(error) {
            logger.error("adaptor orderCreate error", error);
            throw error;
        }

        // Emit event
        Kafka.emit("billing:order:created", {
            billingOrder: result,
            trackId: logger.trackId
        });

        // Return
        return result;
    }
};
