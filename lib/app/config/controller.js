let lodash          = require("lodash"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("config.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {

    /**
     * This function get shared configs.
     */
    static async get(req, res) {
        let logger = Logger.create("get", req.trackId);
        logger.info("enter");

        // Build up shared config.
        let sharedConfig = {};

        for(let key of config.shared) {
            lodash.set(sharedConfig, key, lodash.get(config, key));
        }

        logger.debug("result", {sharedConfig});

        res.send(sharedConfig);
    }
};
