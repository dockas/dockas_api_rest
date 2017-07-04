let lodash = require("lodash");

class ListSubscriptionError {
    constructor(data) {
        lodash.assign(this, data, {name: "ListSubscriptionError"});
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
        NAME_ID_DUPLICATED: 3,
        NO_BILLING_SOURCE: 4,
        INVALID_NEXT_DELIVER_DATE: 5
    },

    Status: {
        "ACTIVE": "active",
        "INACTIVE": "inactive"
    },

    Recurrence: {
        "WEEKLY": "weekly",
        "BIWEEKLY": "biweekly",
        "MONTHLY": "monthly"
    },

    ListSubscriptionError,
    Data,
    Query
};
