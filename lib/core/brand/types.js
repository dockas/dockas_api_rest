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
        NAME_ID_DUPLICATED: 3
    },

    BrandError,
    Data,
    Query
};