let lodash = require("lodash");

class TagError {
    constructor(opts = {}) {
        this.code = opts.code;
        this.message = opts.message;
    }
}

class Data {
    constructor(data) {
        lodash.assign(this, data);
    }
}

class Query {
    constructor(data) {
        lodash.assign(this, data);
    }
}

module.exports = {
    ErrorCode: {
        DB_ERROR: 0,
        NOT_FOUND: 1,
        INVALID_SCHEMA: 2
    },

    TagError,
    Data,
    Query
};