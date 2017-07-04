/* globals __dirname */

let moment              = require("moment"),
    LoggerFactory       = require("common-logger"),
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

        data.totalPrice = priceFormatter.format(data.totalPrice/100);
        data.totalFee = priceFormatter.format(data.totalFee/100);
        data.totalDiscount = priceFormatter.format(data.totalDiscount/100);

        // Parse deliver date.
        data.deliverDate = moment(data.deliverDate).format("DD/MM/YYYY");

        // Render template
        let html = Utils.renderTemplate(`${__dirname}/templates/${lang}/default.mjml`, {
            order: data,
            logoUrl: config.email.urls.logo
        }, {trackId: logger.trackId, engine: "mjml"});

        // Send email
        await Utils.sendEmail({to,html,subject});
    }
    catch(error) {
        logger.error("error", error);
    }
};