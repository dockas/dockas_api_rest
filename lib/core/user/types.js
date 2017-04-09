class UserError {
    constructor(opts = {}) {
        this.code = opts.code;
        this.message = opts.message;
    }
}

module.exports = {
    ErrorCode: {
        DB_ERROR: 0,
        NOT_FOUND: 1,
        INVALID_SCHEMA: 2,
        HASH_ERROR: 3,
        TOKEN_ERROR: 4,
        NICKNAME_GENERATION_ERROR: 5,
        EMAIL_DUPLICATED: 6,
        NICKNAME_DUPLICATED: 7
    },

    UserError
};