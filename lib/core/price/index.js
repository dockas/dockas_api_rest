let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    CreateHandler   = require("./create"),
    FindHandler     = require("./find"),
    RemoveHandler   = require("./remove");

let Logger = new LoggerFactory("price");

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
            await db.createCollection("prices", {
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
        let collection = db.collection("prices");

        this.createHandler = new CreateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        this.removeHandler = new RemoveHandler({collection, mode});

        // Listen to kafka events
        /*Kafka.on("member:added", (data) => {
            globalLogger.info("member:added event received", data);
            this.addMember(data.offer.task, data.offer._id);
        });*/
    }

    /**
     * This function creates a new tag.
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
     * This function removes a tag by it's id.
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
     * This function find tags that match some query.
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
     * This function finds a tag by it's id.
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
};
