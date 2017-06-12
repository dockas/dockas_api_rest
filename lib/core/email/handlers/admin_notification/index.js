/* globals __dirname */

let lodash              = require("lodash"),
    pug                 = require("pug"),
    yaml                = require("js-yaml"),
    fs                  = require("fs"),
    hogan               = require("hogan.js"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    sendgrid            = require("sendgrid")(config.sendgrid.key);

let Logger = new LoggerFactory("email.handlers.admin_notification");

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
        logger.info("enter", {message,lang,__dirname});

        // Load i18n, if it's not loaded yet.
        if(!this.i18n[lang]) {
            try {
                this.i18n[lang] = yaml.load(fs.readFileSync(`${__dirname}/i18n/${lang}.yml`, "utf8"));
                logger.debug("yaml load success", this.i18n);
            }
            catch(error) {
                return logger.error("yaml parser error", error);
            }
        }

        let i18n = this.i18n[lang];
        let {to,body} = message;

        if(!lodash.isArray(to) || !lodash.isObject(body) || !lodash.isObject(body.data)) {
            return logger.error("missing required params");
        }

        // Extract data from body
        let {subject,data} = body;

        subject = i18n[`email_subject_${subject}`];
        logger.debug("translated subject", {subject});

        subject = hogan.compile(subject).render(data);
        logger.debug("compiled subject", {subject});

        // Render html
        let html = pug.renderFile(`${__dirname}/templates/${lang}/default.pug`, {
            title: subject,
            data: JSON.stringify(data),
            logoUrl: config.email.urls.logo
        });

        logger.debug("rendered html", html);

        let request = sendgrid.emptyRequest({
            method: "POST",
            path: "/v3/mail/send",
            body: {
                personalizations: [{
                    to: to.map((email) => {return {email};}),
                    subject: `[ADMIN] ${subject}`
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