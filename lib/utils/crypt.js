let crypto          = require("crypto"),
    lodash          = require("lodash"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger");

let Logger = new LoggerFactory("util.crypt");

module.exports = class CryptUtil {
    static encrypt(data, {
        algorithm="aes256",
        key=config.crypt.key
    }={}) {
        let encrypted,
            logger = Logger.create("encrypt");

        logger.info("enter", {
            data: Logger.secret(data),
            algorithm, key
        });

        let dataStr = lodash.isObject(data) ? JSON.stringify(data) : lodash.isString(data) ? data : null;

        if(dataStr) {
            // Create the cipher
            let cipher = crypto.createCipher(algorithm, key);

            // Update decipher with data.
            cipher.update(dataStr, "utf8", "hex")

            // Generate encrypted data.
            encrypted = cipher.final("hex");
        }

        return encrypted;
    }

    static decrypt(token, {
        algorithm="aes256",
        key=config.crypt.key
    }={}) {
        let decrypted,
            logger = Logger.create("decrypt");

        logger.info("enter", {token,algorithm,key});

        // Create the decipher.
        let decipher = crypto.createDecipher(algorithm, key);

        // Update decipher with token.
        decipher.update(token, "hex", "utf8");

        // Get decrypted token.
        decrypted = decipher.final("utf8");

        // Log
        logger.debug("decrypted", {decrypted});

        // Try to parse decrypted to json.
        try {
            decrypted = JSON.parse(decrypted);
            logger.info("JSON parse success", decrypted);
        }
        catch(error) {
            logger.error("JSON parse of decrypted error", error);
        }

        return decrypted;
    }
};