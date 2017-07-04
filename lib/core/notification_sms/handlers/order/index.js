/* globals __dirname */
let lodash              = require("lodash"),
    moment              = require("moment"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Bitly               = require("bitly"),
    Utils               = require("../../utils");

let Logger = new LoggerFactory("sms.handler.order");
let strings = new Utils.StringsManager(`${__dirname}/strings`);
let bitly = new Bitly(config.bitly.key);

module.exports = class OrderHandler {
    constructor({
        mode="production"
    }={}) {
        this.mode = mode;
    }

    async sendPaymentAuthorized(message) {
        let logger = Logger.create("sendPaymentAuthorized", message.trackId);
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
        let logger = Logger.create("sendStatusUpdated", message.trackId);
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

    async sendListOrderCreated(message={}) {
        let logger = Logger.create("sendListOrderCreated", message.trackId);
        logger.info("enter", message);

        logger.debug("config urls", config.urls);

        // Main variables
        let {to,body} = message,
            {data} = body,
            shortUrl,
            lang = message.lang||config.sms.lang;

        // Load strings file.
        strings.load(lang);

        let oid     = lodash.get(data,"order._id"),
            oc      = lodash.get(data,"order.count"),
            odt     = lodash.get(data, "order.deliverDate"),
            ln      = lodash.get(data, "subscription.list.name"),
            bsm     = lodash.get(data, "subscription.billingSource.method"),
            bsld    = lodash.get(data, "subscription.billingSource.lastDigits"),
            bsb     = lodash.get(data, "subscription.billingSource.brand");

        // First generate a short url with order data.
        try {
            let url = `${config.urls.listOrderApprove}?oid=${oid}&oc=${oc}&odt=${odt}&ln=${ln}&bsm=${bsm}&bsld=${bsld}&bsb=${bsb}`;
            logger.debug("url to be shorten", {url});

            let response = await bitly.shorten(url);
            logger.info("bitly shorten success", response);

            shortUrl = lodash.get(response, "data.url");
        }
        catch(error) {
            logger.error("bitly shorten error", error);
        }

        // Price formatter
        let priceFormatter = new Intl.NumberFormat(lang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Try to parse data and send sms.
        try {
            let text = strings.translate("list_order_created", {data: Object.assign({}, data, {
                shortUrl,
                totalPrice: priceFormatter.format(data.order.totalPrice/100),
                deliverDate: moment(data.order.deliverDate).format("DD/MM/YYYY")
            }), lang});

            // Send sms
            await Utils.sendSMS({to,text});
        }
        catch(error) {
            logger.error("error", error);
        }
    }
};