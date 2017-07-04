let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    Kafka           = require("utils/kafka"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find"),
    RemoveHandler   = require("./remove");

let Logger = new LoggerFactory("list.subscription");

module.exports = class Srv {
    /**
     * This static function setups entity db collection.
     */
    static async setupCollection(db) {
        // Local variables
        let logger = Logger.create("setupCollection");

        logger.info("enter");

        // Try to create the collection
        try {
            await db.createCollection("list_subscriptions", {
                readPreference: "secondaryPreferred"
            });

            logger.info("collection create success");
        }
        catch(error) {
            logger.error("collection create error", error);
        }
    }

    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";
        let db = opts.db || Mongo.db;
        let collection = db.collection("list_subscriptions");

        this.createHandler = new CreateHandler({collection, mode});
        this.updateHandler = new UpdateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        this.removeHandler = new RemoveHandler({collection, mode});

        // Listen to kafka events
        Kafka.on("list:order:created", this.handleListOrderCreatedEvent.bind(this));        
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
     * This function count records matching some query.
     */
    async count(
        query,
        trackId
    ) {
        return await this.findHandler.count(
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
     * This function finds a record by it's nameId.
     */
    async findByNameId(
        nameId,
        trackId
    ) {
        return await this.findHandler.findByNameId(
            nameId,
            trackId
        );
    }

    /**
     * This function handles list order created event.
     */
    async handleListOrderCreatedEvent(message={}) {
        let logger = Logger.create("handleListOrderCreatedEvent", message.trackId);
        logger.info("enter", message);

        let {order} = message;

        // Let's update nextDeliverDate of order list subscription.
        try {
            let subscription = this.updateHandler.updateNextDeliverDate(
                order.listSubscription
            );

            logger.info("subscription updateNextDeliverDate success", subscription);
        }
        catch(error) {
            logger.error("subscription updateNextDeliverDate error", error);
        }
    }
};
