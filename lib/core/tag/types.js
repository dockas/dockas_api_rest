let lodash = require("lodash");

class TagError {
    constructor(data) {
        lodash.assign(this, data, {name: "TagError"});
    }
}

class Data {
    constructor(data) {
        lodash.assign(this, data);
    }
}

class CategoryEdgeData {
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

    TagError,
    Data,
    CategoryEdgeData,
    Query
};