/* globals __dirname,Intl */

let lodash              = require("lodash"),
    pug                 = require("pug"),
    yaml                = require("js-yaml"),
    fs                  = require("fs"),
    hogan               = require("hogan.js"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    sendgrid            = require("sendgrid")(config.sendgrid.key);

let Logger = new LoggerFactory("email.handlers.order_payment_authorized");

module.exports = class Handler {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.i18n = {};
    }

    /**
     * This function send invitation email.
     */
    send(message, lang="pt-br") {
        let logger = Logger.create("send", message.trackId);
        logger.info("enter", {message,lang});

        // Load i18n, if it's not loaded yet.
        if(!this.i18n[lang]) {
            try {
                this.i18n[lang] = yaml.load(fs.readFileSync(`${__dirname}/i18n/${lang}.yml`, "utf8"));
            }
            catch(error) {
                return logger.error("yaml parsere error", error);
            }
        }

        let i18n = this.i18n[lang];
        let {to,body} = message;

        if(!lodash.isArray(to) || !lodash.isObject(body) || !lodash.isObject(body.data)) {
            return logger.error("missing required params");
        }

        // Extract data from body.
        let {data} = body;
        let subject = hogan.compile(i18n.email_subject).render({order: data});
        let priceFormatter = new Intl.NumberFormat(lang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Parse data
        for(let item of data.items) {
            item.product.mainProfileImage = `${config.email.urls.images}/${item.product.mainProfileImage.path}`;
            item.totalPrice = priceFormatter.format((item.priceValue * item.quantity)/100);

            logger.debug("processed item", item);
        }

        // Render html
        let html = pug.renderFile(`${__dirname}/templates/${lang}/default.pug`, {
            order: data,
            logoUrl: config.email.urls.logo,
            imageBaseUrl: config.hostnames.images
        });

        logger.debug("rendered", {subject,html});

        let request = sendgrid.emptyRequest({
            method: "POST",
            path: "/v3/mail/send",
            body: {
                personalizations: [{
                    to: to.map((email) => {return {email};}),
                    subject
                }],
                from: {
                    email: config.email.from,
                    name: config.email.fromname
                },
                content: [{
                    type: "text/html",
                    value: html
                }]
            }
        });

        sendgrid.API(request, function(error, response) {
            if (error) { return logger.error("sendgrid send error", error); }
            logger.info("sendgrid send success", response.body);
        });
    }
};