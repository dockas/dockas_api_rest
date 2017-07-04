let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    Kafka           = require("utils/kafka"),
    Socket          = require("utils/socket"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find"),
    RemoveHandler   = require("./remove");

let Logger = new LoggerFactory("wallet");

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
            await db.createCollection("wallets", {
                readPreference: "secondaryPreferred"
            });

            logger.info("collection create success");
        }
        catch(error) {
            logger.error("collection create error", error);
        }

        // Try to create index on nameId
        /*try {
            await collection.createIndex("nameId", {
                unique: true,
                background: true,
                w:1,
                //partialFilterExpression: { deletedAt: {$type: "null"} }
            });

            logger.info("collection createIndex on nameId success");
        }
        catch(error) {
            logger.error("collection createIndex on nameId error", error);
        }*/
    }

    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";
        let db = opts.db || Mongo.db;
        let collection = this.collection = db.collection("wallets");

        this.createHandler = new CreateHandler({collection, mode});
        this.updateHandler = new UpdateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        this.removeHandler = new RemoveHandler({collection, mode});

        // Listen to kafka events
        Kafka.on("transfer:created", this.handleTransferCreatedEvent.bind(this));
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
     * This function handles order status updated event.
     */
    async handleTransferCreatedEvent(message={}) {
        let result,
            logger = Logger.create("handleTransferCreatedEvent", message.trackId);

        logger.info("enter", message);

        let {data} = message.body;

        // Increment wallet credit (virtual money).
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(data.wallet),
                deletedAt: {$type: "null"}
            }, {$inc: {credit: data.netValue}}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result.value);

            result = result.value;
        }
        catch(error) { 
            logger.error("collection findOneAndUpdate error", error);
        }

        // Notify wallet users.
        if(result.users) {
            Socket.shared.emitToUsers(result.users, "wallet:updated", {
                result,
                updatedKeys: ["credit"]
            });
        }
    }
};
