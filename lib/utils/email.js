let LoggerFactory   = require("common-logger"),
    UserSrv         = require("services/user"),
    Kafka           = require("./kafka");

let Logger = new LoggerFactory("utils.email", {level: "debug"});

module.exports = class Email {
    constructor(config = {}) {
        let logger = Logger.create("constructor");
        logger.info("enter");

        // Set as shared instance.
        if(config.shared) { Email.shared = this; }
    }

    /*async sendToUser(uid, event, body, trackId) {
        let logger = Logger.create("sendToUser", trackId);
        logger.info("enter", {uid, event, body});
    }*/

    /**
     * This function send email to admins.
     */
    async sendToAdmins(event, body, trackId) {
        let logger = Logger.create("sendToAdmins", trackId);
        logger.info("enter", {event, body});

        try {
            let admins = await UserSrv.client.find({
                roles: ["admin"]
            });

            logger.debug("user service find success", {admins, body});

            // Admin emails
            let to = (admins||[]).map((admin) => {
                return admin.email;
            });

            logger.debug("to and body", {to, body});

            Kafka.emit(event, {to,body});
        }
        catch(error) {
            logger.error("user service find error", error);
        }
    }
};