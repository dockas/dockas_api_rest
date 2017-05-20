let Kafka               = require("utils/kafka"),
    InvitationHandler   = require("./invitation");

module.exports = class EmailSrv {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";

        this.invitationHandler = new InvitationHandler({mode});

        Kafka.on("email:invitation", this.invitationHandler.send);
    }
};