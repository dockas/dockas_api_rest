let Joi                 = require("joi"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Kafka               = require("utils/kafka"),
    Crypt               = require("utils/crypt"),
    Model               = require("./model"),
    Types               = require("../types");

let Logger = new LoggerFactory("billing.source");

/**
 * The handler class.
 */
module.exports = class SourceHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.adaptor = opts.adaptor;
    }

    /**
     * This function creates a new payment source.
     */
    async create(
        source,
        trackId
    ) {
        // Local variables
        let valid,
            result,
            logger = Logger.create("create", trackId),
            schema = Model.Schema;

        logger.info("enter", source);

        // Validate data schema
        valid = Joi.validate(source, schema);
        source = valid.value;

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.BillingError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        logger.debug("valid source", {source});

        // Create source through adaptor.
        try {
            result = await this.adaptor.sourceCreate(source, logger.trackId);
            logger.info("adaptor sourceCreate success", result);
        }
        catch(error) {
            logger.error("adaptor sourceCreate error", error);
            throw error;
        }

        // Hash sensitive data.
        if(result.method == "credit_card") {
            result.hash = Crypt.encrypt({
                cvc: lodash.get(source, "data.cvc")
            });
        }

        // Emit event
        Kafka.emit("billing:source:created", {
            billingSource: result,
            trackId: logger.trackId
        });

        return result;
    }

    /**
     * This function removes a payment source.
     */
    async remove(
        id,
        customer,
        trackId
    ) {
        // Local variables
        let result,
            logger = Logger.create("remove", trackId);

        logger.info("enter", {id,customer});

        // Remove source through adaptor.
        try {
            result = await this.adaptor.sourceRemove(id, logger.trackId);
            logger.info("adaptor sourceRemove success", result);
        }
        catch(error) {
            logger.error("adaptor sourceRemove error", error);
            throw error;
        }

        // Emit event
        Kafka.emit("billing:source:removed", {
            billingSource: {_id: id, customer},
            trackId: logger.trackId
        });

        return result;
    }
};
