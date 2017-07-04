let request         = require("request"),
    yaml            = require("js-yaml"),
    fs              = require("fs"),
    path            = require("path"),
    //querystring     = require("querystring"),
    hogan           = require("hogan.js"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger");

let Logger = new LoggerFactory("notification_sms.utils");

class StringsManager {
    constructor(dirPath) {
        this.dirPath = dirPath;
        this.strings = {};
    }

    load(lang=config.sms.lang, trackId) {
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

    translate(key, {data=null, lang=config.sms.lang, trackId=null}={}) {
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
    static sendSMS({
        to=[], 
        text=null
    }={}) {
        if(process.env.NODE_ENV != "production") {
            return Promise.resolve();
        }

        /*let promises = [],
            logger = Logger.create("sendSMS");

        logger.info("enter", {to,text});

        for(let phone of to) {
            ((phone) => {
                promises.push(new Promise((resolve, reject) => {
                    nexmo.message.sendSms(
                        "37904",
                        phone,
                        text,
                        (error, result) => {
                            if(error) {return reject(error);}
                            resolve(result);
                        }
                    );
                }));
            })(phone);
        }

        return Promise.all(promises);*/

        let promises = [],
            logger = Logger.create("sendSMS");

        let envFlag = (
            process.env.NODE_ENV == "development"?"[DEV]":
            process.env.NODE_ENV == "stage"?"[STAGE]":
            process.env.NODE_ENV == "test"?"[TEST]":
            ""
        );

        for(let phone of to) {
            let reqOpts = {
                url: "https://rest.nexmo.com/sms/json",
                method: "POST",
                json: true,
                headers: {},
                body: {
                    api_key: config.sms.api_key,
                    api_secret: config.sms.api_secret,
                    from: "5531983185145",
                    type: "unicode",
                    to: phone,
                    text: `[Dockas]${envFlag} ${text}`
                }
            };

            logger.info("reqOpts", reqOpts);

            // sent a test message
            promises.push(new Promise((resolve, reject) => {
                request(reqOpts, (error, response, body) => {
                    if(error) {
                        logger.error("response error", error);
                        return reject(error);
                    }

                    if(response.statusCode < 200 || response.statusCode > 299) {
                        logger.error("response statusCode error", {
                            statusCode: response.statusCode,
                            body
                        });
                        
                        return reject(body);
                    }

                    logger.info("response success", body);

                    resolve(body);
                });
            }));
        }

        return Promise.all(promises);
    }
}

Utils.StringsManager = StringsManager;

module.exports = Utils;