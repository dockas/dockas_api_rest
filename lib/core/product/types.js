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
        INVALID_SCHEMA: 2,
        UNAUTHORIZED_STATUS: 3,
        MAX_PRODUCT_COUNT_PER_BRAND_REACHED: 4,
        BRAND_NOT_FOUND: 5
    },

    IMAGE_TYPE_PROFILE: "profile",
    IMAGE_TYPE_DEFAULT: "default",

    STATUS_NOT_APPROVED: "not_approved",
    STATUS_PUBLIC: "public",
    STATUS_PRIVATE: "private",

    ProductError,
    Data,
    Query
};