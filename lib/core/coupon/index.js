let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    //Kafka           = require("utils/kafka"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find"),
    RemoveHandler   = require("./remove");

let Logger = new LoggerFactory("coupon");

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
            collection = await db.createCollection("coupons", {
                readPreference: "secondaryPreferred"
            });

            logger.info("collection create success");
        }
        catch(error) {
            logger.error("collection create error", error);
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
        let collection = db.collection("coupons");

        this.createHandler = new CreateHandler({collection, mode});
        this.updateHandler = new UpdateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        this.removeHandler = new RemoveHandler({collection, mode});

        // Listen to kafka events
        //Kafka.on("alert:create", this.handleAlertCreateEvent.bind(this));
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
     * This function applies a coupon to an user by it's id.
     */
    async apply(
        id,
        uid,
        trackId
    ) {
        return await this.updateHandler.apply(
            id,
            uid,
            trackId
        );
    }

    /**
     * This function applies a coupon to an user by it's nameId.
     */
    async applyByNameId(
        nameId,
        uid,
        trackId
    ) {
        return await this.updateHandler.applyByNameId(
            nameId,
            uid,
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
        await this.removeHandler.remove(
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
     * This function finds a record by it's name id.
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
     * This function handles order status updated event.
     */
    /*async handleAlertCreateEvent(data = {}) {
        let logger = Logger.create("handleAlertCreateEvent", data.trackId);
        logger.info("enter", data);

        // Create an alert.
        try {
            await this.createHandler.create(
                data,
                logger.trackId
            );

            logger.info("alert create success");
        }
        catch(error) { 
            logger.error("alert create error", error);
        }
    }*/
};
