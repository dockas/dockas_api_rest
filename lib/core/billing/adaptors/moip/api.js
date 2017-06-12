/* globals Buffer */

let request             = require("request"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config");

let Logger = new LoggerFactory("billing.adaptors.moip.api");

module.exports = class MoipApi {
    constructor() {
        let logger = Logger.create("constructor");
        logger.info("enter");

        let {token,key,sandbox} = config.billing.adaptors.moip;

        this.authKey = Buffer.from(`${token}:${key}`).toString("base64");
        this.sandbox = sandbox;

        this.baseUrl = sandbox ?
            "https://sandbox.moip.com.br/v2" :
            "https://api.moip.com.br/v2";

        logger.debug("config", {
            config: config.billing.adaptors.moip,
            authKey: this.authKey,
            baseUrl: this.baseUrl,
            sandbox
        });
    }

    _request(
        method="GET",
        path=null,
        data=null
    ) {
        let logger = Logger.create("request");
        logger.info("enter", {method,path,data});

        return new Promise((resolve, reject) => {
            method = method.toUpperCase();

            let reqOpts = {
                url: `${this.baseUrl}/${path}`,
                method,
                json: true,
                headers: {
                    Authorization: `Basic ${this.authKey}`
                }
            };

            if(method == "GET") {reqOpts.qs = data;}
            else {reqOpts.body = data;}

            logger.debug("request opts", {reqOpts, config: config.billing.adaptors.moip});

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
        });
    }

    customerCreate(data) {
        return this._request("POST", "customers", data);
    }

    customerFundingInstrumentAdd(id, data) {
        return this._request("POST", `customers/${id}/fundinginstruments`, data);
    }

    customerFundingInstrumentRemove(id) {
        return this._request("DELETE", `fundinginstruments/${id}`);
    }

    orderCreate(data) {
        return this._request("POST", "orders", data);
    }

    orderPay(id, data) {
        return this._request("POST", `orders/${id}/payments`, data);
    }

    paymentFindById(id) {
        return this._request("GET", `payments/${id}`, null);
    }

    notificationCreate(data) {
        return this._request("POST", "preferences/notifications", data);
    }

    notificationFind() {
        return this._request("GET", "preferences/notifications", null);
    }

    notificationRemove(id) {
        return this._request("DELETE", `preferences/notifications/${id}`, null);
    }
};