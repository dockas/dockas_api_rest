/* global __rootdir */

let mime            = require("mime"),
    path            = require("path"),
    ms              = require("ms"),
    FileSrv         = require("services/file"),
    FileSrvUtils    = require("core/file/utils"),
    LoggerFactory   = require("common-logger"),
    config          = require("common-config");

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

    static async view(req, res) {
        let filePath,
            logger = Logger.create("view", req.trackId);
        
        logger.info("enter", {id: req.params.id});

        try {
            filePath = await FileSrv.client.getPath(req.params.id);
            logger.info("file service getPath success", {filePath});
        }
        catch(error) {
            logger.error("file service getPath error", error);
            res.serverError(error);
        }

        let type = mime.lookup(filePath);
        let foldername = FileSrvUtils.getMimeFolderName(type);
        let fileFullPath = path.resolve(__rootdir+"/"+config.files.dir+"/"+foldername+"/"+filePath);

        logger.debug("data", {type, foldername, fileFullPath});

        res.type(type);
        res.sendFile(fileFullPath, {maxAge: ms("1y")});
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new FileSrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await FileSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("file service find error", error);
            return res.serverError(error);
        }

        logger.info("file service find success", {
            count: records.length
        });

        res.success(records);
    }

    /**
     * This function finds a record by it's unique id.
     */
    static async findById(req, res) {
        let record,
            logger = Logger.create("findById", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find records
        try {
            record = await FileSrv.client.findById(req.params.id, logger.trackId);
            logger.info("file service findById success", record);
        }
        catch(error) {
            logger.error("file service findById error", error);
            return res.serverError(error);
        }

        res.success(record);
    }
};
