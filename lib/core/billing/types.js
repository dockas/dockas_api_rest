let lodash = require("lodash");

class BillingError {
    constructor(data) {
        lodash.assign(this, data, {name: "BillingError"});
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

    FeeType: {
        PERCENTUAL: "percentual",
        FIXED: "fixed"
    },

    BillingError,
    Data,
    Query
};