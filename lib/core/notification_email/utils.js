let pug                 = require("pug"),
    yaml                = require("js-yaml"),
    fs                  = require("fs"),
    path                = require("path"),
    hogan               = require("hogan.js"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    sendgrid            = require("sendgrid")(config.sendgrid.key);

let Logger = new LoggerFactory("email.utils");

class StringsManager {
    constructor(dirPath) {
        this.dirPath = dirPath;
        this.strings = {};
    }

    load(lang=config.email.lang, trackId) {
        if(!lang){return;}

        let json = null;
        let filePath = path.resolve(this.dirPath, `${lang}.yml`);
        let logger = Logger.create("load", trackId);
        logger.info("enter", {lang, dirPath: this.dirPath, filePath});

        try {
            json = yaml.load(fs.readFileSync(filePath, "utf8"));
        }
        catch(error) {
            logger.error("yaml parser error", error);
        }

        logger.debug("json", {json});

        if(json) {
            logger.debug("json loaded");
            this.strings[lang] = json;
        }
    }

    translate(key, {data=null, lang=config.email.lang, trackId=null}={}) {
        let logger = Logger.create("translate", trackId);
        let strings = this.strings[lang];

        logger.info("enter", {strings});

        if(!strings) { 
            throw "lang not loaded"; 
        }

        let compiled = hogan.compile(strings[key]).render(data||{});

        logger.debug("compiled", {compiled});

        return compiled;
    }
}

class Utils {
    static renderTemplate(templatePath, data, trackId) {
        let logger = Logger.create("renderTemplate", trackId);
        logger.info("enter", {templatePath, data});

        let html = pug.renderFile(templatePath, data);

        logger.debug("rendered html", html);

        return html;
    }

    static sendEmail({
        to=[],
        subject=null,
        html=null
    }, trackId) {
        let logger = Logger.create("sendEmail", trackId);
        logger.info("enter", {to, subject, html});

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

        return new Promise((resolve, reject) => {
            sendgrid.API(request, function(error, response) {
                if (error) { 
                    logger.error("sendgrid send error", error);
                    return reject(error);
                }

                logger.info("sendgrid send success", response.body);
                resolve(response.body);
            });
        });
    }
}

Utils.StringsManager = StringsManager;

module.exports = Utils;