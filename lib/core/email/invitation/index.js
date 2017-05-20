/* global __rootdir */

let LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    pug                 = require("pug"),
    path                = require("path"),
    sendgrid            = require("sendgrid")(config.sendgrid.key);

let Logger = new LoggerFactory("email.invitation");

module.exports = class EmailSrv {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
    }

    /**
     * This function send invitation email.
     */
    send(data) {
        let logger = Logger.create("send", data.trackId);
        logger.info("enter", data);

        if(!data || !data.email || !data._id){
            return logger.error("missing required params");
        }

        let html = pug.renderFile(path.resolve(
            __rootdir,
            config.email.templatesPath, 
            config.email.invitation.templateFileName
        ), {
            signupUrl: `${config.email.invitation.signupUrl}?invitation=${data._id}`,
            logoUrl: config.email.logoUrl
        });

        console.log("config sendgrid", config.sendgrid);

        let request = sendgrid.emptyRequest({
            method: "POST",
            path: "/v3/mail/send",
            body: {
                personalizations: [{
                    to: [{
                        email: data.email,
                    }],
                    subject: config.email.invitation.subject,
                }],
                from: {
                    email: config.email.invitation.from,
                    name: config.email.invitation.fromname
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