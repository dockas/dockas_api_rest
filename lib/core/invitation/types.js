let lodash = require("lodash");

class InvitationError {
    constructor(data) {
        lodash.assign(this, data, {name: "InvitationError"});
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

    STATUS_OPEN: "open",
    STATUS_CLOSED: "closed",

    InvitationError,
    Data,
    Query
};