let fs                  = require("fs"),
    LoggerFactory       = require("common-logger"),
    utils               = require("../utils");

let Logger = new LoggerFactory("file");

/**
 * The handler class.
 */
module.exports = class CheckHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
    }


    /**
     * This function checks if a chunk was already uploaded.
     */
    checkChunk(
        uid, 
        info,
        trackId
    ) {
        let logger = Logger.create("checkChunk", trackId);
        logger.info("enter", {uid, info});

        let fid = info.flowIdentifier;
        let chunkNumber = info.flowChunkNumber;
        let filename = info.flowFilename;
        let chunkPath = utils.getChunkPath(uid, fid, chunkNumber);

        return new Promise((resolve) => {
            fs.exists(chunkPath, (exists) => {
                resolve(exists ? {
                    chunkPath: chunkPath,
                    filename: filename,
                    fid: fid
                } : undefined);
            });
        });
    }
};