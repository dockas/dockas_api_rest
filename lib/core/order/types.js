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

    STATUS_OPEN: "open",
    STATUS_AWAITING_USER_AVAILABILITY: "awaiting_user_availability",
    STATUS_USER_AVAILABLE: "user_available",
    STATUS_USER_UNAVAILABLE: "user_unavailable",
    STATUS_CONFIRMED: "confirmed",
    STATUS_BOXED: "boxed",
    STATUS_DELIVERING: "delivering",
    STATUS_CLOSED: "closed",

    OrderError,
    Data,
    Query
};