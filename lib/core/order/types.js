let lodash = require("lodash");

class OrderError {
    constructor(opts = {}) {
        this.name = "OrderError";
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
        delete this.populate;
    }
}

module.exports = {
    ErrorCode: {
        DB_ERROR: 0,
        NOT_FOUND: 1,
        INVALID_SCHEMA: 2
    },

    STATUS_OPEN: "open",
    STATUS_CLOSED: "closed",

    OrderError,
    Data,
    Query
};