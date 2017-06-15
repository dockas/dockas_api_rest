let request         = require("request"),
    LoggerFactory   = require("common-logger"),
    Types           = require("../../types");

let Logger = new LoggerFactory("postal_code_resolvers.bra");

module.exports = class Resolver {
    static resolve(postalCode, trackId) {
        let logger = Logger.create("resolve", trackId);
        logger.info("enter", {postalCode});

        return new Promise((resolve, reject) => {
            request({
                method: "GET",
                url: `http://viacep.com.br/ws/${postalCode}/json/`,
                qs: null
            }, (error, response, body) => {
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

                try {
                    let json = JSON.parse(body);
                    logger.info("response success", json);

                    if(json.erro) {
                        reject(new Types.AddressError({
                            code: Types.ErrorCode.NOT_FOUND,
                            message: "could not resolve postal code"
                        }));
                    }

                    // Normalize result
                    let normalizedResult = {
                        neighborhood: json.bairro,
                        street: json.logradouro,
                        city: json.localidade,
                        state: json.uf,
                        country: "BRA",
                        postalCode: postalCode.replace(/[-_\.]/g, "")
                    };

                    logger.debug("normalized result", normalizedResult);

                    resolve(normalizedResult);
                }
                catch(error) {
                    reject(error);
                }
            });
        });
    }
};