let lodash = require("lodash");

class NotificationError {
    constructor(data) {
        lodash.assign(this, data, {name: "NotificationError"});
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

    Status: {
        NEW: 0,
        VIEWED: 1,
        CLICKED: 2
    },

    NotificationError,
    Data,
    Query
};