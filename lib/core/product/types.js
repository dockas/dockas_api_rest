let lodash = require("lodash");

class ProductError {
    constructor(data) {
        lodash.assign(this, data, {name: "ProductError"});
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

    IMAGE_TYPE_PROFILE: "profile",
    IMAGE_TYPE_DEFAULT: "default",

    ProductError,
    Data,
    Query
};