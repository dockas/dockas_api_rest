class AuthError {
    constructor(data) {
        Object.assign(this, data, {name: "AuthError"});
    }
}

module.exports = {
    ErrorCode: {
        DB_ERROR: 0,
        NOT_FOUND: 1,
        INVALID_EMAIL_OR_PASSWORD: 2,
        INVALID_AUTH_TOKEN: 3,
        NOT_ACTIVATED: 4,
        HASH_ERROR: 5,
        TOKEN_ERROR: 6
    },

    AuthError
};