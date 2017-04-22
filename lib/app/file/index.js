/* globals __rootdir */

let express     = require("express"),
    authPol     = require("policies/auth"),
    Ctrl        = require("./controller"),
    config      = require("common-config"),
    multer      = require("multer")({dest: __rootdir+"/"+config.files.tmpDir});

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/upload", authPol, Ctrl.uploadGet);
    router.post("/upload", authPol, multer.any(), Ctrl.uploadPost);
    router.get("/:id", Ctrl.view);

    return router;
};