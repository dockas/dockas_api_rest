let lodash = require("lodash");

class FileError {
    constructor(data) {
        lodash.assign(this, data, {name: "FileError"});
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

    FileError,
    Data,
    Query
};