let FileSrv         = require("services/file"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("file.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    
    static async uploadGet(req, res) {
        let logger = Logger.create("uploadGet", req.trackId);
        logger.info("enter");

        try {
            let result = await FileSrv.client.checkChunk(req.uid, req.query);
            logger.info("checkChunk success", result);

            res.sendStatus(result ? 200 : 404);
        }
        catch(error) {
            logger.error("checkChunk error", error);
            res.sendStatus(404);
        }
    }

    static async uploadPost(req, res) {
        let logger = Logger.create("uploadPost", req.trackId);
        logger.info("enter", req.body);

        try {
            let result = await FileSrv.client.upload(req.uid, req.files, req.body);

            logger.info("upload success", result);

            if(result == "partly_done") {res.sendStatus(200);}
            else {res.send(result);}
        }
        catch(error) {
            logger.error("upload error", error);

            res.serverError(error);
        }
    }
};
