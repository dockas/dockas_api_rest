let LoggerFactory   = require("common-logger"),
    Kafka           = require("./kafka"),
    lodash          = require("lodash");

let Logger = new LoggerFactory("utils.socket", {level: "debug"});

/**
 * The main class.
 */
module.exports = class Socket {
    constructor(config = {}) {
        let logger = Logger.create("constructor");
        logger.info("enter");

        // Set as shared instance.
        if(config.shared) { Socket.shared = this; }

        // Create a kafka instance.
        /*this.kafkaClient = new Kafka({
            zkHost: config.zkHost,
            producerOnly: true,
            producer: {
                topics: ["socket"]
            }
        });*/
    }

    /**
     * This function emits an event to all connected
     * users.
     */
    emit(evtName, evtData) {
        Kafka.emit("socket:message", {
            data: {
                evtName,
                evtData
            }
        });
    }

    /**
     * This function emits an event to an especific
     * user.
     */
    emitToUser(userId, evtName, evtData) {
        let logger = Logger.create("emitToUser");
        logger.info("enter", {
            userId,
            evtName,
            evtData
        });

        Kafka.emit("socket:message", {
            userId,
            data: {
                evtName,
                evtData
            }
        });
    }

    emitToRole(userRole, evtName, evtData) {
        let logger = Logger.create("emitToRole");
        logger.info("enter", {
            userRole,
            evtName,
            evtData
        });

        Kafka.emit("socket:message", {
            userRole,
            data: {
                evtName,
                evtData
            }
        });
    }

    /**
     * This function emits an event to a list of
     * users.
     */
    emitToUsers(uids = [], evtName, evtData, opts = {}) {
        let logger = Logger.create("emitToUsers");

        logger.info("enter", {
            uids,
            evtName,
            evtData,
            includeRoles: opts.includeRoles
        });

        Kafka.emit("socket:message", {
            userId: uids,
            includeRoles: opts.includeRoles,
            data: {
                evtName,
                evtData
            }
        });
    }
};
