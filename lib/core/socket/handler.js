let lodash                          = require("lodash"),
    LoggerFactory                   = require("common-logger"),
    AuthSrv                         = require("services/auth"),
    UserSrv                         = require("services/user"),
    socketData                      = require("./data"),
    {userSocketIds,roleUserIds}       = socketData[process.env.NOMAD_ALLOC_ID];

let Logger = new LoggerFactory("socket");

module.exports = class SocketHandler {
    constructor({
        mode="production",
        socket=null,
        io=null,
        trackId=null
    } = {}) {
        this.mode = mode;
        this.socket = socket;
        this.io = io;
        this.trackId = trackId;
        this.uid = null;

        // Event handlers.
        if(socket) {
            this.socket.on("sign", this.handleSignEvent.bind(this));
        }
    }

    /**
     * This function handles sign event from authenticated user.
     */
    async handleSignEvent(token) {
        let uid,
            logger = Logger.create("handleSignEvent", this.trackId);
        
        logger.info("enter", { token: Logger.secret(token) });

        try {
            uid = this.uid = await AuthSrv.client.signed(token);
            logger.debug("auth service signed success", {uid});

            userSocketIds[uid] = (userSocketIds[uid]||[]).concat([this.socket.id]);
            logger.debug("userSocketIds", userSocketIds);
        }
        catch(error) {
            return logger.error("auth service signed error", error);
        }

        // Get user role
        try {
            let user = await UserSrv.client.findById(uid);
            logger.debug("user service findById success", {user});

            // Register socket user role.
            for(let role of user.roles) {
                roleUserIds[role] = roleUserIds[role]||[];
                roleUserIds[role].push(uid);
            }
        }
        catch(error) {
            return logger.error("user service findById error", error);
        }

        // Emit sign success
        this.socket.emit("sign:success");

        // Emit socket:change event to sync data through
        // all socket service instances. This is necessary
        // to keep global socket data in all service instances
        // that gonna be used by rest api to determine
        // if an user is online or to get all users 
        // joined to a specific room.
        /*Kafka.emit("socket:changed", {
            id: process.env.NOMAD_ALLOC_ID,
            userSocketIds
        });*/
    }

    async handleUnsignEvent() {
        let logger = Logger.create("handleUnsignEvent", this.trackId);
        logger.info("enter", {uid: this.uid});

        this.unsign();
    }

    handleDisconnectEvent() {
        let logger = Logger.create("handleDisconnectEvent");
        logger.info("enter");

        this.unsign();
    }

    unsign() {
        let logger = Logger.create("unsign");
        logger.info("enter", {uid: this.uid, socketId: this.socket.id});

        if(!this.uid){return;}

        logger.debug("userSocketIds before", userSocketIds);

        lodash.remove(userSocketIds[this.uid], (sid) => {
            return sid == this.socket.id;
        });

        if(userSocketIds[this.uid]&&!userSocketIds[this.uid].length) {
            delete userSocketIds[this.uid];
        }

        logger.debug("userSocketIds after", userSocketIds);

        this.socket.emit("unsign:success");

        // Emit socket:change event to sync data through
        // all socket service instances. This is necessary
        // to keep global socket data in all service instances
        // that gonna be used by rest api to determine
        // if an user is online or to get all users 
        // joined to a specific room.
        /*Kafka.emit("socket:changed", {
            id: process.env.NOMAD_ALLOC_ID,
            userSocketIds
        });*/
    }
};