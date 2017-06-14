/* globals __dirname */
let lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Utils               = require("../../../utils");

let Logger = new LoggerFactory("email.handler.order.status_updated");
let strings = new Utils.StringsManager(`${__dirname}/strings`);

module.exports = async function(message) {
    let logger = Logger.create("send", message.trackId);
    logger.info("enter", message);

    // Main variables
    let {to,body} = message,
        lang = message.lang||config.email.lang;

    // Load strings file.
    strings.load(lang);

    // Try to parse data and send email.
    try {
        let {data} = body;
        let subject = strings.translate(`email_subject_${data.status}`, {data,lang});

        // Render template
        let html = Utils.renderTemplate(`${__dirname}/templates/${lang}/${data.status}.pug`, {
            order: data,
            logoUrl: config.email.urls.logo
        });

        // Send email
        await Utils.sendEmail({to,html,subject});
    }
    catch(error) {
        logger.error("error", error);
    }
};