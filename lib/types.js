let lodash = require("lodash");

class ApiError {
    constructor(data) {
        lodash.assign(this, data, {name: "ApiError"});
    }
}

module.exports = {
    ErrorCode: {
        USER_ALREADY_EXISTS: 0,
        INVITATION_ALREADY_USED: 1,
        ONLY_ADMINS_ALLOWED: 2,
        UNAUTHORIZED: 3,
        MISSING_BILLING_INFO: 4,
        ONLY_OWNERS_ALLOWED: 5,
        ONLY_AUTHORIZED_OWNERS_ALLOWED: 6
    },
    
    ApiError
};