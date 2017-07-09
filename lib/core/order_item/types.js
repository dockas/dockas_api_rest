let lodash = require("lodash");

class OrderItemError {
    constructor(data) {
        lodash.assign(this, data, {name: "OrderItemError"});
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
        ONLY_ADMINS_OR_APPROVED_OWNERS_ALLOWED: 3
    },

    Status: {
        UNAPPROVED: "unapproved",
        PENDING: "pending",
        READY: "ready",
        STOCKED: "stocked",
        PACKAGED: "packaged"
    },

    StatusPriority: [
        "stocked",
        "ready",
        "pending"
    ],

    SellerFeeType: {
        PERCENTUAL: "percentual",
        FIXED: "fixed"
    },

    OrderItemError,
    Data,
    Query
};
