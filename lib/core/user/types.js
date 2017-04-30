let lodash = require("lodash");

class UserError {
    constructor(data) {
        this.name = "UserError";
        lodash.assign(this, data);
    }
}

class Data {
    constructor(data) {
        lodash.assign(this, data);
    }
}

class AddressData {
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
        HASH_ERROR: 3,
        TOKEN_ERROR: 4,
        USER_ALREADY_EXISTS: 5,
        EMAIL_DUPLICATED: 6
    },

    ROLE_ADMIN: "admin",
    ROLE_USER: "user",
    ROLE_SELLER: "seller",

    UserError,
    Data,
    AddressData,
    Query
};