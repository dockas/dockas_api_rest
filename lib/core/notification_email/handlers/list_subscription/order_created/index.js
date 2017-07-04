/* globals __dirname */

let moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Utils               = require("../../../utils");

let Logger = new LoggerFactory("email.handler.list_subscription.order_created");
let strings = new Utils.StringsManager(`${__dirname}/strings`);

module.exports = async function(message) {
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
        let {order,subscription} = data;
        let subject = strings.translate("email_subject", {data,lang});

        // Price formatter
        let priceFormatter = new Intl.NumberFormat(lang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Parse total price
        order.totalPrice = priceFormatter.format(data.totalPrice/100);

        // Parse deliver date.
        // 
        // @TODO : localize deliverDate format.
        order.deliverDate = moment(order.deliverDate).format("DD/MM/YYYY");

        // Build approveUrl
        let oid     = lodash.get(data,"order._id"),
            oc      = lodash.get(data,"order.count"),
            odt     = lodash.get(data, "order.deliverDate"),
            ln      = lodash.get(data, "subscription.list.name"),
            bsm     = lodash.get(data, "subscription.billingSource.method"),
            bsld    = lodash.get(data, "subscription.billingSource.lastDigits"),
            bsb     = lodash.get(data, "subscription.billingSource.brand");

        let approveUrl = `${config.urls.listOrderApprove}?oid=${oid}&oc=${oc}&odt=${odt}&ln=${ln}&bsm=${bsm}&bsld=${bsld}&bsb=${bsb}`;

        // Render template
        let html = Utils.renderTemplate(`${__dirname}/templates/${lang}/default.mjml`, {
            order,
            subscription,
            approveUrl,
            logoUrl: config.email.urls.logo
        }, {trackId: logger.trackId, engine: "mjml"});

        // Send email
        await Utils.sendEmail({to,html,subject});
    }
    catch(error) {
        logger.error("error", error);
    }
};