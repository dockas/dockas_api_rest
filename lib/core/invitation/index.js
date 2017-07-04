let moment          = require("moment"),
    Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    config          = require("common-config"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find"),
    RemoveHandler   = require("./remove");

let Logger = new LoggerFactory("invitation");

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
            collection = await db.createCollection("invitations", {
                readPreference: "secondaryPreferred"
            });

            logger.info("collection create success");
        }
        catch(error) {
            logger.error("collection create error", error);
        }

        // Try to create index on email
        try {
            await collection.createIndex("email", {
                unique: true,
                background: true,
                w:1,
                partialFilterExpression: { deletedAt: {$type: "null"} }
            });

            logger.info("collection createIndex on name success");
        }
        catch(error) {
            logger.error("collection createIndex on name error", error);
        }

    }

    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";
        let db = opts.db || Mongo.db;
        let collection = this.collection = db.collection("invitations");

        this.createHandler = new CreateHandler({collection, mode});
        this.updateHandler = new UpdateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        this.removeHandler = new RemoveHandler({collection, mode});

        // Listen to kafka events
        /*Kafka.on("member:added", (data) => {
            globalLogger.info("member:added event received", data);
            this.addMember(data.offer.task, data.offer._id);
        });*/
    }

    /**
     * This function creates a new record.
     */
    async create(
        data,
        trackId
    ) { 
        let result = await this.createHandler.create(
            data,
            trackId
        );

        if(["Belo Horizonte"].indexOf(result.postalCodeAddress.city) >= 0) {
            let numSentInvitationsInThisWeek,
                logger = Logger.create("auto sent check");

            logger.debug("enter", {maxAutoSendPerWeek: config.invitation.maxAutoSendPerWeek});

            // Let's check if we gonna auto send the new invitation.
            // First, check if the number of invitations sent this week
            // already reached the maximum.
            let query = {
                sentCount: {$gte: 1},
                createdAt: {
                    $gte: moment().startOf("week").startOf("day").toISOString(),
                    $lte: moment().toISOString()
                }
            };

            logger.debug("query", query);

            try {
                numSentInvitationsInThisWeek = await this.collection.count(query);
                logger.debug("collection count success", {numSentInvitationsInThisWeek});
            }
            catch(error) {
                logger.error("collection count error", error);
                numSentInvitationsInThisWeek = config.invitation.maxAutoSendPerWeek;
            }

            if(numSentInvitationsInThisWeek < config.invitation.maxAutoSendPerWeek) {
                logger.debug("let's auto send");
                this.send(result._id);
            }
        }

        return result;
    }

    /**
     * This function updates a record by it's id.
     */
    async update(
        id,
        data,
        trackId
    ) {
        await this.updateHandler.update(
            id,
            data,
            trackId
        );
    }

    /**
     * This function send a record to user.
     */
    async send(
        id,
        trackId
    ) {
        return await this.updateHandler.send(
            id,
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
};
