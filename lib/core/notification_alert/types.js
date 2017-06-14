let lodash = require("lodash");

class NotificationAlertError {
    constructor(data) {
        lodash.assign(this, data, {name: "NotificationAlertError"});
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
        REMOVED: 2
    },

    NotificationAlertError,
    Data,
    Query
};