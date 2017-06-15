let LoggerFactory   = require("common-logger"),
    countries       = require("./countries");

let Logger = new LoggerFactory("postal_code.find");

module.exports = class Handler {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
    }

    /**
     * This function find an address by it's postal code
     */
    async findAddress(
        postal_code,
        country_code,
        trackId
    ) {
        let logger = Logger.create("findAddress", trackId);
        logger.info("enter", {postal_code,country_code});
        return countries[country_code].getPostalCodeInfo(postal_code, trackId);
    }
};
