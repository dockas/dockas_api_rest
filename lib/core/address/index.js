let FindHandler     = require("./find");

module.exports = class Srv {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";

        this.findHandler = new FindHandler({mode});
    }

    /**
     * This function find an address by it's postal code
     */
    async findByPostalCode(
        postalCode,
        countryCode,
        trackId
    ) {
        return await this.findHandler.findByPostalCode(
            postalCode,
            countryCode,
            trackId
        );
    }
};
