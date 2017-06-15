let lodash = require("lodash");

class PostalCodeError {
    constructor(data) {
        lodash.assign(this, data, {name: "PostalCodeError"});
    }
}

module.exports = {
    ErrorCode: {
        DB_ERROR: 0,
        NOT_FOUND: 1,
        INVALID_SCHEMA: 2
    },

    PostalCodeError
};