let lodash = require("lodash");

class BrandError {
    constructor(data) {
        lodash.assign(this, data, {name: "BrandError"});
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
        UNAUTHORIZED_STATUS: 4,
        MAX_BRAND_COUNT_REACHED: 5,
        MAX_PRODUCT_COUNT_REACHED: 6,
        MISSING_CREATOR: 7,
        ONLY_APPROVED_OWNERS_ALLOWED: 8
    },
    
    Status: {
        NOT_APPROVED: "not_approved",
        PUBLIC: "public",
        PRIVATE: "private"
    },

    OwnerStatus: {
        APPROVED: "approved",
        MAX_BRAND_COUNT_REACHED: "max_brand_count_reached"
    },

    OwnerRole: {
        ADMIN: "admin"
    },

    BrandError,
    Data,
    Query
};