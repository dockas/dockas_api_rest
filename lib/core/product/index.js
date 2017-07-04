let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    Kafka           = require("utils/kafka"),
    Socket          = require("utils/socket"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find"),
    RemoveHandler   = require("./remove");

let Logger = new LoggerFactory("product");

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
            collection = await db.createCollection("products", {
                readPreference: "secondaryPreferred"
            });

            logger.info("collection create success");
        }
        catch(error) {
            logger.error("collection create error", error);
        }

        // Try to create index on name
        try {
            await collection.createIndex("name", {
                background: false,
                w:1
            });

            logger.info("collection createIndex on name success");
        }
        catch(error) {
            logger.error("collection createIndex on name error", error);
        }

        // Try to create index on category tagNameId
        try {
            await collection.createIndex("category.tagNameId", {
                background: false,
                w:1
            });

            logger.info("collection createIndex on category.tagNameId success");
        }
        catch(error) {
            logger.error("collection createIndex on category.tagNameId error", error);
        }

        // Try to create index on nameId
        try {
            await collection.createIndex("nameId", {
                unique: true,
                background: true,
                w:1,
                partialFilterExpression: { deletedAt: {$type: "null"} }
            });

            logger.info("collection createIndex on nameId success");
        }
        catch(error) {
            logger.error("collection createIndex on nameId error", error);
        }
    }

    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";
        let db = opts.db || Mongo.db;
        let collection = this.collection = db.collection("products");

        this.createHandler = new CreateHandler({collection, mode});
        this.updateHandler = new UpdateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        this.removeHandler = new RemoveHandler({collection, mode});

        // Listen to kafka events
        Kafka.on("order:created", this.handleOrderCreatedEvent.bind(this));

        // @TODO : listen to order status changed to DELIVER_FAILED
        // or PAYMENT_FAILED and restore product stock. In case of 
        // products with supplyType=on_demand, increment internalStock
        // instead of stock.
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
     * This function finds a record by it's nameId
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
     * This function handles order created event.
     */
    async handleOrderCreatedEvent(data={}) {
        let {order,trackId} = data,
            logger = Logger.create("handleOrderCreatedEvent", trackId);

        logger.info("enter", {order});

        // @WARNING : We do not modify stock for orders generated
        // from list subscriptions.
        if(order.listSubscription) {return;}

        // Decrement product stock of each order item.
        for(let item of order.items) {
            logger.debug("decrement stock for item", item);

            this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(item.product),
                deletedAt: {$type: "null"}
            }, {$inc: {stock: -(item.quantity)}}, {returnOriginal: false})
            .then((result) => {
                let product = result.value;

                logger.debug("product stock updated", product);

                // Emit to users
                Socket.shared.emit("product:updated", {
                    result: product,
                    updatedKeys: ["stock"]
                });
            });
        }
    }
};
