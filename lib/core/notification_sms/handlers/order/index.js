/* globals __dirname */
let LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Utils               = require("../../utils");

let Logger = new LoggerFactory("sms.handler.order.status_updated");
let strings = new Utils.StringsManager(`${__dirname}/strings`);

module.exports = class OrderHandler {
    constructor({
        mode="production"
    }={}) {
        this.mode = mode;
    }

    async sendPaymentAuthorized(message) {
        let logger = Logger.create("send", message.trackId);
        logger.info("enter", message);

        // Main variables
        let {to,body} = message,
            lang = message.lang||config.sms.lang;

        // Load strings file.
        strings.load(lang);

        // Try to parse data and send sms.
        try {
            let {data} = body;
            let text = strings.translate("payment_authorized", {data,lang});

            // Send email
            await Utils.sendSMS({to,text});
        }
        catch(error) {
            logger.error("error", error);
        }
    }

    async sendStatusUpdated(message) {
        let logger = Logger.create("send", message.trackId);
        logger.info("enter", message);

        // Main variables
        let {to,body} = message,
            lang = message.lang||config.sms.lang;

        // Load strings file.
        strings.load(lang);

        // Try to parse data and send sms.
        try {
            let {data} = body;
            let text = strings.translate(`status_updated_to_${data.status}`, {data,lang});

            // Send email
            await Utils.sendSMS({to,text});
        }
        catch(error) {
            logger.error("error", error);
        }
    }
};