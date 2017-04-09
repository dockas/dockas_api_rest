let LoggerFactory       = require("common-logger"),
    bcrypt              = require("bcryptjs");

let Logger = new LoggerFactory("auth");

module.exports = async function(password, hashedPassword) {
    let logger = Logger.create("comparePassword");
    logger.info("enter", {
        password: Logger.secret(password),
        hashedPassword: Logger.secret(hashedPassword)
    });

    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hashedPassword, (error, match) => {
            if(error){
                logger.error("bcrypt compare error", error);
                return reject(error);
            }

            logger.info("bcrypt compare success", {match: match});
            resolve(match);
        });
    });
};
