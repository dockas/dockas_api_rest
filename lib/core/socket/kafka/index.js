let lodash                              = require("lodash"),
    LoggerFactory                       = require("common-logger"),
    socketData                          = require("../data"),
    {userSocketIds,roleUserIds}         = socketData[process.env.NOMAD_ALLOC_ID];

let Logger = new LoggerFactory("socket.kafka", {level: "debug"});

/**
 * The handler class.
 */
module.exports = class KafkaHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor({
        mode="production",
        io=null
    } = {}) {
        this.mode = mode;
        this.io = io;

        //console.log("io", io);
    }

    /**
     * This function handles socket:message event.
     */
    async handleSocketMessageEvent(message) {
        let logger = Logger.create("handleSocketMessageEvent", (message||{}).trackId);
        logger.info("enter", message);

        // Decode message
        let {userId, includeRoles, data} = message;
        let {evtName,evtData} = data;

        // Emit to all connected sockets
        if(!userId && !includeRoles) {
            return this.io.emit(evtName, evtData);
        }

        // Emit to specific users.
        if(userId || includeRoles) {
            let userIds = userId ? lodash.flatten([userId]) : [];

            logger.debug("original userIds", {userIds, includeRoles, roleUserIds});

            for(let role of includeRoles||[]) {
                userIds = userIds.concat(roleUserIds[role]||[]);
            }

            // Remove eventual duplicates
            userIds = lodash.uniq(userIds);

            logger.debug("final userIds", {userIds});

            // Emit to each user
            for(let uid of userIds) {
                let socketIds = userSocketIds[uid] || [];

                logger.debug("socketIds", {uid, socketIds});

                for(let socketId of socketIds) {
                    logger.debug("sending to socketId", {
                        socketId,
                        evtName,
                        evtData
                    });

                    this.io.to(socketId).emit(evtName, evtData);
                }
            }
        }
    }
};