/* globals __dirname */
let LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Utils               = require("../../../utils");

let Logger = new LoggerFactory("email.handler.order.status_updated");
let strings = new Utils.StringsManager(`${__dirname}/strings`);

module.exports = async function(message) {
    let {to,body} = message,
        lang = message.lang||config.email.lang,
        logger = Logger.create("send", message.trackId);
    
    logger.info("enter", message);

    // Load strings file.
    strings.load(lang);

    // Get data
    try {
        let {data} = body;
        let subject = strings.translate(`email_subject_${data.status}`, {data,lang});

        // Render template
        let html = Utils.renderTemplate(`${__dirname}/templates/${lang}/${data.status}.mjml`, {
            order: data,
            logoUrl: config.email.urls.logo
        }, {trackId: logger.trackId, engine: "mjml"});

        // Send email
        await Utils.sendEmail({to,html, subject: `[ADMIN] ${subject}`});
    }
    catch(error) {
        logger.error("error", error);
    }
};