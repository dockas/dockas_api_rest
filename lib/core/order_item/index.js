let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    Kafka           = require("utils/kafka"),
    Socket          = require("utils/socket"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find"),
    RemoveHandler   = require("./remove");

let Logger = new LoggerFactory("order_item");

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
            await db.createCollection("order_items", {
                readPreference: "secondaryPreferred"
            });

            logger.info("collection create success");
        }
        catch(error) {
            logger.error("collection create error", error);
        }

        // Try to create compound index on nameId
        /*try {
            await collection.createIndex("nameId", {
                unique: true,
                background: true,
                w:1,
                partialFilterExpression: { deletedAt: {$type: "null"} }
            });

            logger.info("collection createIndex on nameId,user success");
        }
        catch(error) {
            logger.error("collection createIndex on nameId,user error", error);
        }*/
    }

    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";
        let db = opts.db || Mongo.db;
        let collection = db.collection("order_items");

        this.createHandler = new CreateHandler({collection, mode});
        this.updateHandler = new UpdateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        this.removeHandler = new RemoveHandler({collection, mode});

        // Listen to kafka events
        //Kafka.on("order:created", this.handleOrderCreatedEvent.bind(this));
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
     * This function handles order created event.
     */
    /*async handleOrderCreatedEvent(data={}) {
        let {order,trackId} = data,
            logger = Logger.create("handleOrderCreatedEvent", trackId);

        logger.info("enter", {order});

        // @WARNING : We do not modify stock for orders generated
        // from list subscriptions.
        if(order.listSubscription) {return;}

        // Decrement product stock of each order item.
        for(let item of order.items) {
            logger.debug("decrement quantity for item", item);

            this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(item.productBatch),
                deletedAt: {$type: "null"}
            }, {$inc: {quantity: -(item.quantity)}}, {returnOriginal: false})
            .then((result) => {
                let productBatch = result.value;

                logger.debug("product batch quantity updated", productBatch);

                // Emit to users
                Socket.shared.emit("product_batch:updated", {
                    result: FindHandler.Model.format(productBatch),
                    updatedKeys: ["quantity"]
                });
            });
        }
    }*/
};
