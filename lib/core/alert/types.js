let lodash = require("lodash");

class AlertError {
    constructor(data) {
        lodash.assign(this, data, {name: "AlertError"});
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
        EMAIL_DUPLICATED: 3,
        INVITATION_CLOSED: 4
    },

    STATUS_CLICKED: "clicked",
    STATUS_VIEWED: "viewed",
    STATUS_NEW: "new",

    AlertError,
    Data,
    Query
};