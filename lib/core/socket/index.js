process.env.NOMAD_ALLOC_ID = "monolithic";

let IO              = require("socket.io"),
    LoggerFactory   = require("common-logger"),
    Kafka           = require("utils/kafka"),
    KafkaHandler    = require("./kafka"),
    SocketHandler   = require("./handler");

let Logger = new LoggerFactory("socket");

module.exports = class Socket {
    constructor(server, opts = {}) {
        let mode = this.mode = opts.mode || "production";
        let io = this.io = IO(server);
        let socketHandlers = this.socketHandlers = {};

        // Setup io
        io.set("origins", "*:*");

        // Init handlers
        this.kafkaHandler = new KafkaHandler({io, mode});

        // Listen to kafka events.
        Kafka.on("socket:message", this.kafkaHandler.handleSocketMessageEvent.bind(this.kafkaHandler));
        //Kafka.on("socket:changed", this.kafkaHandler.handleSocketChangedEvent.bind(this.kafkaHandler));

        // Listen to socket events.
        io.on("connection", (socket) => {
            let logger = Logger.create("connection");
            logger.info("enter", {socketId: socket.id});

            socket.emit("connected", "Hello! :)");

            socketHandlers[socket.id] = new SocketHandler({socket, io, mode});

            socket.on("disconnect", () => {
                socketHandlers[socket.id].handleDisconnectEvent();
                delete socketHandlers[socket.id];
            });
        });
    }

    // This function gets all online users
    getOnlineUsers(
        trackId
    ) {
        let logger = Logger.create("getOnlineUsers", trackId);
        logger.info("enter");
    }
};

