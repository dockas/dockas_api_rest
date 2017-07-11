/* globals __dirname */

let LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Utils               = require("../../../utils");

let Logger = new LoggerFactory("email.handler.admin.message");
let strings = new Utils.StringsManager(`${__dirname}/strings`);

module.exports = async function(message) {
    console.log("########## NODE_ENV =", process.env.NODE_ENV);

    // Prevent sending email from environment other than production.
    if(process.env.NODE_ENV != "production") {return Promise.resolve();}

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
        let html = Utils.renderTemplate(`${__dirname}/templates/${lang}/default.mjml`, {
            title: subject,
            data: JSON.stringify(data),
            logoUrl: config.email.urls.logo
        }, {trackId: logger.trackId, engine: "mjml"});

        // Send email
        await Utils.sendEmail({to,html, subject: `[ADMIN] ${subject}`});
    }
    catch(error) {
        logger.error("error", error);
    }
};