/* globals __dirname */

let LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Utils               = require("../../../utils");

let Logger = new LoggerFactory("email.handler.admin.message");
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
        let {subject, data} = body;
        subject = strings.translate(`email_subject_${subject}`, {data,lang});

        // Render template
        let html = Utils.renderTemplate(`${__dirname}/templates/${lang}/default.pug`, {
            title: subject,
            data: JSON.stringify(data),
            logoUrl: config.email.urls.logo
        });

        // Send email
        await Utils.sendEmail({to,html,subject});
    }
    catch(error) {
        logger.error("error", error);
    }
};