let lodash = require("lodash");

class CompanyError {
    constructor(data) {
        lodash.assign(this, data, {name: "CompanyError"});
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

    CompanyError,
    Data,
    Query
};