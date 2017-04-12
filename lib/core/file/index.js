let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    UploadHandler   = require("./upload"),
    CheckHandler     = require("./check");

let Logger = new LoggerFactory("user");

module.exports = class FileSrv {
    /**
     * This static function setups room db collection.
     */
    static async setupCollection(db) {
        // Local variables
        let logger = Logger.create("setupCollection");

        logger.info("enter");

        // Try to create the collection
        try {
            await db.createCollection("files");

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
        let collection = db.collection("files");

        this.uploadHandler = new UploadHandler({collection, mode});
        this.checkHandler = new CheckHandler({mode});
    }

    /**
     * This function handles new chunk upload.
     */
    upload(
        uid, 
        files, 
        fields,
        trackId
    ) {
        return this.uploadHandler.upload(
            uid, 
            files, 
            fields,
            trackId
        );
    }

    /**
     * This function check if a chuck was already uploaded.
     */
    checkChunk(
        uid, 
        info,
        trackId
    ) {
        return this.checkHandler.checkChunk(
            uid,
            info,
            trackId
        );
    }
};