let lodash = require("lodash");

class OrderError {
    constructor(data) {
        lodash.assign(this, data, {name: "OrderError"});
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
        INVALID_SCHEMA: 2,
        NOT_OWNER: 3
    },

    Status: {
        PAYMENT_PENDING: "payment_pending",
        PAYMENT_AUTHORIZED: "payment_authorized",
        PACKAGED: "packaged",
        DELIVERING: "delivering",
        DELIVERED: "delivered"
    },

    OrderError,
    Data,
    Query
};