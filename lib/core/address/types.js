let lodash = require("lodash");

class AddressError {
    constructor(data) {
        lodash.assign(this, data, {name: "AddressError"});
    }
}

module.exports = {
    ErrorCode: {
        DB_ERROR: 0,
        NOT_FOUND: 1,
        INVALID_SCHEMA: 2
    },

    AddressError
};