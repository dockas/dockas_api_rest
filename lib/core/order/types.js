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
        NOT_OWNER: 3,
        ITEM_NOT_FOUND: 4,
        ONLY_LIST_SUBSCRIPTION_ORDER_ALLOWED: 5,
        ONLY_UNAPPROVED_ORDER_ALLOWED: 6,
        TOTAL_PRICE_BELLOW_MINIMUM: 7
    },

    Status: {
        UNAPPROVED: "unapproved",
        PAYMENT_PENDING: "payment_pending",
        PAYMENT_AUTHORIZED: "payment_authorized",
        PAYMENT_FAILED: "payment_failed",
        PACKAGED: "packaged",
        DELIVERING: "delivering",
        DELIVERED: "delivered",
        CANCELED: "canceled",
        DELIVER_FAILED: "deliver_failed"
    },

    ItemStatus: {
        PENDING: "pending",
        READY: "ready",
        STOCKED: "stocked",
        PACKAGED: "packaged"
    },

    FeeType: {
        DELIVER: "deliver"
    },

    PaymentType: {
        DEFAULT: "default",
        ON_DELIVER: "on_deliver"
    },

    OrderError,
    Data,
    Query
};