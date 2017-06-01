let LoggerFactory   = require("common-logger"),
    Kafka           = require("utils/kafka"),
    Adaptors        = require("./adaptors"),
    CustomerHandler = require("./customer"),
    OrderHandler    = require("./order"),
    SourceHandler   = require("./source"),
    ChargeHandler   = require("./charge");

let Logger = new LoggerFactory("billing");

module.exports = class Srv {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";

        // Instantiate the payment gateway adaptor.
        let adaptor = new Adaptors.Moip();

        // Instantiate the handlers
        this.customerHandler = new CustomerHandler({mode,adaptor});
        this.orderHandler = new OrderHandler({mode,adaptor});
        this.sourceHandler = new SourceHandler({mode,adaptor});
        this.chargeHandler = new ChargeHandler({mode,adaptor});

        // Listen to kafka events
        Kafka.on("user:created", this.handleUserCreatedEvent.bind(this));
    }

    /**
     * This function creates a client.
     */
    async customerCreate(
        data,
        trackId
    ) {
        return await this.customerHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function creates a payment source.
     */
    async sourceCreate(
        data,
        trackId
    ) { 
        return await this.sourceHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function removes a payment source.
     */
    async sourceRemove(
        id,
        customer,
        trackId
    ) { 
        return await this.sourceHandler.remove(
            id,
            customer,
            trackId
        );
    }

    /**
     * This function creates an order.
     */
    async orderCreate(
        data,
        trackId
    ) { 
        return await this.orderHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function creates a charge.
     */
    async chargeCreate(
        data,
        trackId
    ) { 
        return await this.chargeHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function finds a charge by it's unique id.
     */
    async chargeFindById(
        id,
        trackId
    ) { 
        return await this.chargeHandler.findById(
            id,
            trackId
        );
    }

    /**
     * This function handles user created event.
     */
    async handleUserCreatedEvent(data = {}) {
        let logger = Logger.create("handleUserCreatedEvent", data.trackId);
        logger.info("enter", data);

        // Try to create customer.
        try {
            let result = await this.customerHandler.create(
                data,
                logger.trackId
            );

            logger.info("customer create success", result);
        }
        catch(error) { 
            logger.error("customer create error", error);
        }
    }
};
