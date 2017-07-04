let lodash                  = require("lodash"),
    LoggerFactory           = require("common-logger"),
    postalCodeResolvers     = require("./postal_code_resolvers");

let Logger = new LoggerFactory("address.find");

module.exports = class Handler {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
    }

    /**
     * This function find an address by it's postal code.
     */
    async findByPostalCode(
        postalCode,
        countryCode="BRA",
        trackId
    ) {
        let logger = Logger.create("getPostalCodeInfo Google Maps", trackId);
        
        logger.info("enter", {postalCode,countryCode});

        // Require resolver function by countryCode
        let PostalCodeResolver = postalCodeResolvers[countryCode];

        // Clean postal code.
        postalCode = postalCode.replace(/[-_\.]/g, "");

        // Return resolve result
        return await PostalCodeResolver.resolve(postalCode, trackId);
    }
};
