let lodash = require("lodash");

class CouponError {
    constructor(data) {
        lodash.assign(this, data, {name: "CouponError"});
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
        INVALID_SCHEMA: 2,
        ALREADY_APPLIED: 3,
        UNAVAILABLE: 4
    },

    VALUE_TYPE_PERCENTUAL: "percentual",
    VALUE_TYPE_MONETARY: "monetary",

    CouponError,
    Data,
    Query
};