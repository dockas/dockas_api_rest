let lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    pug                 = require("pug"),
    subjects            = require("./subjects.json"),
    sendgrid            = require("sendgrid")(config.sendgrid.key);

let Logger = new LoggerFactory("email.handlers.new_order");

module.exports = class Handler {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
    }

    /**
     * This function send invitation email.
     */
    send(message, lang="pt-br") {
        let logger = Logger.create("send", data.trackId);
        logger.info("enter", {data,lang});

        let {to,data} = message;

        if(!lodash.isArray(to) || lodash.isObject(data)) {
            return logger.error("missing required params");
        }

        let html = pug.renderFile(`./templates/${lang}.pug`, Object.assign({}, data, {
            logoUrl: config.email.urls.logo
        }));

        let request = sendgrid.emptyRequest({
            method: "POST",
            path: "/v3/mail/send",
            body: {
                personalizations: [{
                    to: to.map((email) => {return {email};}),
                    subject: subjects[lang],
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