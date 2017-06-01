let ArangoDB            = require("arangojs").Database,
    LoggerFactory       = require("common-logger");

let Logger = new LoggerFactory("utils.arango");

module.exports = class Arango {
    static async connect(url="tcp://localhost:8529", dbName, opts={}) {
        let logger = Logger.create("connect");
        logger.info("enter", {url, dbName, opts});

        let arangoConfig = Object.assign({}, opts.config, {url});

        logger.debug("arango config", arangoConfig);

        let db = new ArangoDB(arangoConfig);

        if(opts.setAsDefault) {Arango.db = db;}

        // Create database if not already created.
        try {
            await db.createDatabase(dbName);
            logger.info("arango createDatabase success");
        }
        catch(error) {
            logger.error("arango createDatabase error", error.message);
        }

        db.useDatabase(dbName);
    }
}