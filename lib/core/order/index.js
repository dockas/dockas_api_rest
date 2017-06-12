let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    Kafka           = require("utils/kafka"),
    //Types           = require("./types"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find"),
    RemoveHandler   = require("./remove");

let Logger = new LoggerFactory("order");

module.exports = class Srv {
    /**
     * This static function setups entity db collection.
     */
    static async setupCollection(db) {
        // Local variables
        let collection,
            logger = Logger.create("setupCollection");

        logger.info("enter");

        // Try to create the collection
        try {
            collection = await db.createCollection("orders", {
                readPreference: "secondaryPreferred"
            });

            logger.info("collection create success");
        }
        catch(error) {
            logger.error("collection create error", error);
        }

        // Try to create index on billingOrder
        try {
            await collection.createIndex("billingOrder", {
                background: true,
                w:1
            });

            logger.info("collection createIndex on billingOrder success");
        }
        catch(error) {
            logger.error("collection createIndex on billingOrder error", error);
        }
    }

    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";
        let db = opts.db || Mongo.db;
        let collection = db.collection("orders");

        this.createHandler = new CreateHandler({collection, mode});
        this.updateHandler = new UpdateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        this.removeHandler = new RemoveHandler({collection, mode});

        // Listen to kafka events
        Kafka.on("billing:order:created", this.handleBillingOrderCreatedEvent.bind(this));
        Kafka.on("billing:charge:created", this.handleBillingChargeCreatedEvent.bind(this));
    }

    /**
     * This function creates a new record.
     */
    async create(
        data,
        trackId
    ) { 
        return await this.createHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function updates a record by it's id.
     */
    async update(
        id,
        data,
        trackId
    ) {
        return await this.updateHandler.update(
            id,
            data,
            trackId
        );
    }

    /**
     * This function updates the status of a record.
     */
    async updateStatus(
        id,
        status,
        trackId
    ) {
        return await this.updateHandler.updateStatus(
            id,
            status,
            trackId
        );
    }

    /**
     * This function removes a record by it's id.
     */
    async remove(
        id,
        trackId
    ) {
        return await this.removeHandler.remove(
            id,
            trackId
        );
    }

    /**
     * This function find records that match some query.
     */
    async find(
        query,
        trackId
    ) {
        return await this.findHandler.find(
            query,
            trackId
        );
    }

    /**
     * This function finds a record by it's id.
     */
    async findById(
        id,
        trackId
    ) {
        return await this.findHandler.findById(
            id,
            trackId
        );
    }

    /**
     * This function finds a record by it's billing id.
     */
    async findByBillingOrderId(
        id,
        trackId
    ) {
        return await this.findHandler.findByBillingOrderId(
            id,
            trackId
        );
    }

    /**
     * This function handles billing order created event.
     */
    async handleBillingOrderCreatedEvent(data) {
        let logger = Logger.create("handleBillingOrderCreatedEvent", data.trackId);
        logger.info("enter", data);

        let {billingOrder} = data;

        // Update order with billingOrder
        try {
            let result = await this.updateHandler.update(
                billingOrder.order,
                {billingOrder: billingOrder._id},
                logger.trackId
            );

            logger.info("order update success", result);
        }
        catch(error) {
            logger.error("order update error", error);
        }
    }

    /**
     * This function handles billing charge created event.
     */
    async handleBillingChargeCreatedEvent(data) {
        let order,
            {billingCharge} = data,
            logger = Logger.create("handleBillingChargeCreatedEvent", data.trackId);

        logger.info("enter", data);

        // Find order by it's billing order id.
        try {
            order = await this.findHandler.findByBillingOrderId(billingCharge.order);
            logger.info("order findByBillingOrderId success", order);
        }
        catch(error) {
            return logger.error("order update error", error);
        }

        // Update order with billingCharge
        try {
            let result = await this.updateHandler.update(
                order._id,
                {billingCharge: billingCharge._id},
                logger.trackId
            );

            logger.info("order update success", result);
        }
        catch(error) {
            logger.error("order update error", error);
        }
    }
};
