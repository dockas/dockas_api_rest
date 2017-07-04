let Joi                 = require("joi"),
    LoggerFactory       = require("common-logger"),
    Kafka               = require("utils/kafka"),
    Crypt               = require("utils/crypt"),
    Model               = require("./model"),
    Types               = require("../types");

let Logger = new LoggerFactory("billing.charge");

/**
 * The handler class.
 */
module.exports = class ChargeHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.adaptor = opts.adaptor;
    }

    /**
     * This function creates a new charge on payment gateway.
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

        // Decrypt hash data and pass it to adaptor
        data.source.hash = Crypt.decrypt(data.source.hash);

        // Log decrypted hash.
        logger.info("decrypted hash", {hash: Logger.secret(data.source.hash)});

        // Create charge using the adaptor
        try {
            result = await this.adaptor.chargeCreate(data);
            logger.info("adaptor chargeCreate success", result);
        }
        catch(error) {
            logger.error("adaptor chargeCreate error", error);
            throw error;
        }

        // Emit event
        Kafka.emit("billing:charge:created", {
            billingCharge: result,
            trackId: logger.trackId
        });

        return result;
    }

    async findById(
        id,
        trackId
    ) {
        // Local variables
        let result,
            logger = Logger.create("findById", trackId);

        logger.info("enter", {id});

        // Create charge using the adaptor
        try {
            result = await this.adaptor.chargeFindById(id, logger.trackId);
            logger.info("adaptor chargeFindById success", result);
        }
        catch(error) {
            logger.error("adaptor chargeFindById error", error);
            throw error;
        }

        return result;
    }
};
