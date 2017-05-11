let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    UploadHandler   = require("./upload"),
    CheckHandler    = require("./check"),
    FindHandler     = require("./find"),
    Types           = require("./types");

let Logger = new LoggerFactory("file");

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
        let collection = this.collection = db.collection("files");

        this.uploadHandler = new UploadHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
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

    /**
     * This function gets the file path.
     */
    async getPath(
        id,
        trackId
    ) {
        let file,
            logger = Logger.create("getPath", trackId);

        logger.info("enter", {id});

        try {
            file = await this.collection.findOne({
                _id: Mongo.toObjectID(id)
            });
        }
        catch(error) {
            logger.error("collection find one error", error);

            throw new Types.FileError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        logger.info("collection find one success", file);

        return file.path;
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
};