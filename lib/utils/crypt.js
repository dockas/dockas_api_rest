let crypt           = require("crypt"),
    lodash          = require("lodash"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger");

let Logger = new LoggerFactory("util.crypt");

module.exports = class CryptUtil {
    static encrypt(data, {
        algorithm="aes256",
        key=config.crypt.key
    }) {
        let logger = Logger.create("encrypt");
        logger.info("enter", {
            data: Logger.secret(data),
            algorithm, key
        });

        let dataStr = lodash.isObject(data) ? JSON.stringify(data) : lodash.isString(data) ? data : null;

        if(dataStr) {
            let cipher = CryptUtil.cipher = CryptUtil.cipher || crypto.createCipher(algorithm, key);
            let encrypted = cipher.update(dataStr, "utf8", "hex") + cipher.final("hex");

            return encrypted;
        }
    }

    static decrypt(token, {
        algorithm="aes256",
        key=config.crypt.key
    }) {
        let logger = Logger.create("encrypt");
        logger.info("enter", {token,algorithm,key});

        var decipher = CryptUtil.decipher = CryptUtil.decipher || crypto.createDecipher(algorithm, key);
        var decrypted = decipher.update(token, "hex", "utf8") + decipher.final("utf8");

        try {
            decrypted = JSON.parse(decrypted);

            logger.error("JSON parse success", decrypted);
        }
        catch(error) {
            logger.error("JSON parse of decrypted error", error);
        }

        return decrypted;
    }
};