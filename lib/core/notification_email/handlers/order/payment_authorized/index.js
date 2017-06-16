/* globals __dirname */

let LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Utils               = require("../../../utils");

let Logger = new LoggerFactory("email.handler.admin.message");
let strings = new Utils.StringsManager(`${__dirname}/strings`);

module.exports = async function(message, {
    imagesBaseUrl=config.email.urls.images
}={}) {
    let logger = Logger.create("send", message.trackId);
    logger.info("enter", message);

    // Main variables
    let {to,body} = message,
        lang = message.lang||config.email.lang;

    let envFlag = (
        process.env.NODE_ENV == "development"?"[DEV] ":
        process.env.NODE_ENV == "stage"?"[STAGE] ":
        process.env.NODE_ENV == "test"?"[TEST] ":
        ""
    );

    // Load strings file.
    strings.load(lang);

    // Try to parse data.
    try {
        let {data} = body;
        let subject = strings.translate("email_subject", {data,lang});

        // Price formatter
        let priceFormatter = new Intl.NumberFormat(lang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Parse data
        for(let item of data.items) {
            item.product.mainProfileImage = `${imagesBaseUrl}/${item.product.mainProfileImage.path}`;
            item.totalPrice = priceFormatter.format((item.priceValue * item.quantity)/100);

            logger.debug("processed item", item);
        }

        // Render template
        let html = Utils.renderTemplate(`${__dirname}/templates/${lang}/default.pug`, {
            order: data,
            logoUrl: config.email.urls.logo
        });

        // Send email
        await Utils.sendEmail({to,html,subject: `${envFlag}${subject}`});
    }
    catch(error) {
        logger.error("error", error);
    }
};