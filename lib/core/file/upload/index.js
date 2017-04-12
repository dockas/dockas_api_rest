let fs                  = require("fs"),
    path                = require("path"),
    mime                = require("mime"),
    gm                  = require("gm"),
    crypto              = require("crypto"),
    LoggerFactory       = require("common-logger"),
    utils               = require("../utils");

let Logger = new LoggerFactory("file");

/**
 * The handler class.
 */
module.exports = class UploadHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
    }

    /**
     * This function renames the uploaded file.
     */
    rename(oldChunkPath, chunkPath) {
        return new Promise((resolve) => {
            fs.rename(oldChunkPath, chunkPath, () => {
                resolve();
            });
        });
    }

    write(uid, filepath, fid, trackId) {
        let logger = Logger.create("write", trackId);
        logger.info("enter", {uid, filepath, fid});

        return new Promise((resolve) => {
            // Create write stream to merge chunks into only one file.
            let wStream = fs.createWriteStream(filepath);

            // Pipe chunk to write stream function.
            let pipeChunk = (chunkNumber) => {
                let chunkPath = utils.getChunkPath(uid, fid, chunkNumber);

                fs.exists(chunkPath, (exists) => {
                    if(exists) {
                        // If the current chunk exists, then read from it
                        // and pipe to the write stream.
                        let rStream = fs.createReadStream(chunkPath);

                        // Pipe read stream to write stream.
                        rStream.pipe(wStream, { end: false });

                        // On end of current chunk read pipe we pass to next chunk.
                        rStream.on("end", function() {
                            pipeChunk(chunkNumber+1);
                        });
                    }
                    else {
                        // If chunk does not exists, then all chunks were piped to
                        // write stream (we must be in in 'done' status already).
                        wStream.end();

                        resolve();
                    }
                });
            };

            // Start piping chunks to write stream.
            pipeChunk(1);
        });
    }

    createImageThumbs(uid, imgFullPath, trackId) {
        let logger = Logger.create("createImageThumbs", trackId);
        logger.info("enter", {uid, imgFullPath});

        let thumbs = {};

        // TODO : Rescale to other sizes.
        let size = 200;

        // Rescale image to 100px height.
        var imgDir = path.dirname(imgFullPath);
        var imgName = path.basename(imgFullPath, path.extname(imgFullPath));
        var thumbPath = imgName + "_thumb_Ax"+size+".jpg";
        var thumbFullPath = path.resolve(imgDir, thumbPath);

        logger.debug("info", {
            imgDir,
            imgName,
            thumbPath,
            thumbFullPath
        });

        return new Promise((resolve, reject) => {
            gm(imgFullPath)
            .flatten()
            .resize(null, size)
            .write(thumbFullPath, (error) => {
                if(error) {
                    logger.error("gm error", error);
                    return resolve();
                }

                logger.debug("gm success");

                this.create({
                    type: "thumb",
                    uploader: uid,
                    mime: "image/jpg",
                    name: imgName,
                    path: thumbPath,
                    size: 0
                }).then((thumb) => {
                    if(error){
                        logger.error("createImageThumbs : mongodb error", error);
                        return reject(error);
                    }

                    thumbs["Ax"+size] = thumb._id;

                    logger.debug("success", {thumbs});

                    resolve(thumbs);
                })
                .catch((error) => {
                    reject(error);
                });
            });
        });
    }

    async create(data, trackId) {
        let logger = Logger.create("create", trackId);
        logger.info("enter", data);

        let result = await this.collection.insertOne(data);
        logger.info("collection insertOne success", {id: result.insertedId});

        return result.insertedId;
    }

    clean(uid, fid, trackId) {
        let logger = Logger.create("write", trackId);
        logger.info("enter", {uid, fid});

        return new Promise((resolve, reject) => {
            let pipeChunkRm = function(chunkNumber) {
                let chunkPath = utils.getChunkPath(uid, fid, chunkNumber);

                fs.exists(chunkPath, function(exists) {
                    if(exists) {
                        fs.unlink(chunkPath, function(err) {
                            return reject(err);
                        });

                        pipeChunkRm(chunkNumber+1);
                    }
                    else {
                        return resolve();
                    }
                });
            };

            pipeChunkRm(1);
        });
    }

    /**
     * This function checks if a chunk was already uploaded.
     */
    async upload(
        uid, 
        files, 
        fields,
        trackId
    ) {
        let logger = Logger.create("upload", trackId);
        logger.info("enter", {uid, fields});

        let fid = fields["flowIdentifier"];
        let chunkNumber = fields["flowChunkNumber"];
        let chunkTotal = fields["flowTotalChunks"];
        let filename = fields["flowFilename"];
        let totalSize = fields["flowTotalSize"];

        logger.info("hello1", {
            fid,chunkNumber,chunkTotal,filename,totalSize
        });

        let oldChunkPath = files[0].path;
        let chunkPath = utils.getChunkPath(uid, fid, chunkNumber);

        logger.info("hello2");

        // Rename chunk
        await this.rename(oldChunkPath, chunkPath);

        logger.info("chunk renamed");

        // Check if we have all file chunks.
        let chunkCount = 1;

        // Count how many chunks has already been received.
        while(chunkCount <= chunkTotal) {
            let chunkPath = utils.getChunkPath(uid, fid, chunkCount);

            logger.info("chunk path", {chunkPath});

            let exists = fs.existsSync(chunkPath);

            // Chunk exists
            if(exists) { 
                logger.info("chunk exists");
                chunkCount++; 
            }
            // Chunk doesn't exists => We do not received all chunks yet.
            else {
                logger.info("partly_done");
                return "partly_done";
            }
        }

        logger.info("all chunks uploaded");

        // If we already received all chunks, then report done status.
        let data = {
            name: filename,
            path: crypto.randomBytes(20).toString("hex") + path.extname(filename),
            mime: mime.lookup(filename),
            size: parseInt(totalSize),
            uploader: uid,
            meta: fields.meta ? JSON.parse(fields.meta) : null
        };

        logger.info("data", data);

        // Create resource dir if not there yet.
        let rsrcDirPath = utils.createResourceDir(data.mime);

        // File path withing resource dir.
        let filepath = path.resolve(rsrcDirPath, data.path);

        // Write flow chunks to a file in filepath.
        await this.write(uid, filepath, fid, logger.trackId);

        logger.info("chunk written");

        // If file is image, create thumbnails for it.
        if((/image\/*/).test(data.mime)) {
            logger.info("file is image");

            let thumbs = await this.createImageThumbs(uid, filepath, logger.trackId);

            data.meta = data.meta || {};
            data.meta.thumbs = thumbs;
        }

        // Create database entry
        let fileId = await this.create(data, logger.trackId);

        logger.info("database entry created", {fileId});

        // Remove temp files.
        await this.clean(uid, fid, logger.trackId);

        logger.info("chunk cleaned");

        // Return the created file id.
        return fileId;
    }
};