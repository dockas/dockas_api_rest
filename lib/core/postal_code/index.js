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
    async findAddress(
        postal_code,
        country_code="BRA",
        trackId
    ) {
        return await this.findHandler.findAddress(
            postal_code,
            country_code,
            trackId
        );
    }
};
