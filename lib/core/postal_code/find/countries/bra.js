let request         = require("request"),
    LoggerFactory   = require("common-logger"),
    Types           = require("../../types");

let Logger = new LoggerFactory("find.countries.bra");

module.exports = class CountryHandler {
    static getPostalCodeInfo(postal_code, trackId) {
        let logger = Logger.create("getPostalCodeInfo", trackId);
        logger.info("enter", {postal_code});

        return new Promise((resolve, reject) => {
            request({
                method: "GET",
                url: `http://viacep.com.br/ws/${postal_code}/json/`,
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
                        reject(new Types.PostalCodeError({
                            code: Types.ErrorCode.NOT_FOUND,
                            message: "postal_code not found"
                        }));
                    }

                    // Normalize result
                    let normalizedResult = {
                        neighborhood: json.bairro,
                        street: json.logradouro,
                        city: json.localidade,
                        state: json.uf,
                        country: "BRA",
                        postalCode: postal_code.replace(/[-_\.]/g, "")
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