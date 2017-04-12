/* globals __rootdir */

let path                = require("path"),
    mkdirp              = require("mkdirp"),
    config              = require("common-config"),
    LoggerFactory       = require("common-logger");

let Logger = new LoggerFactory("file.utils");

module.exports = class Utils {
    static getMimeFolderName(mimeType) {
        if((/image\/*/).test(mimeType)) { return "images"; }
        return "";
    }

    static getChunkPath(uid, fid, chunkNumber) {
        return path.resolve(__rootdir+"/"+config.files.tmpDir, `${uid}.${fid}.${chunkNumber}`);
    }

    static createResourceDir(mimeType) {
        let logger = Logger.create("createResourceDir");
        logger.info("enter", {mimeType});

        let folderpath = __rootdir+"/"+config.files.dir+"/"+Utils.getMimeFolderName(mimeType);
        mkdirp.sync(folderpath);
        return folderpath;
    }
};