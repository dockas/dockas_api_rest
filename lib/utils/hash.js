let bcrypt          = require("bcryptjs"),
    LoggerFactory   = require("common-logger");

let Logger = new LoggerFactory("utils.hash");

// Global constants
const SALT_WORK_FACTOR = 10;

/**
 * This function hashes a password
 */
async function hash(value="") {
    // Local variables
    let logger = Logger.create("hash");
    logger.info("enter", {value: Logger.secret(value)});

    return new Promise((resolve, reject) => {
        // We use a bcrypt algorithm (see http://en.wikipedia.org/wiki/Bcrypt).
        bcrypt.genSalt(SALT_WORK_FACTOR, (error, salt) => {
            if(error){
                logger.error("bcrypt genSalt error", error);
                return reject(error);
            }

            logger.info("bcrypt genSalt success", salt);

            // Hash with generated salt.
            bcrypt.hash(value, salt, (error, hash) => {
                if(error){
                    logger.error("bcrypt hash error", error);
                    return reject(error);
                }

                logger.info("bcrypt hash success", hash);
                resolve(hash);
            });
        });
    });
}

module.exports = hash;
