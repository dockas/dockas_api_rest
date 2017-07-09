let lodash = require("lodash");

class PriceError {
    constructor(data) {
        lodash.assign(this, data, {name: "PriceError"});
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

    PriceType: {
        "PRODUCT_COST": "product_cost",
        "PRODUCT_PRICE": "product_price"
    },

    PriceError,
    Data,
    Query
};