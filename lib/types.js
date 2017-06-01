let lodash = require("lodash");

class ApiError {
    constructor(data) {
        lodash.assign(this, data);
    }
}

module.exports = {
    ErrorCode: {
        USER_ALREADY_EXISTS: 0,
        INVITATION_ALREADY_USED: 1,
        ONLY_ADMINS_ALLOWED: 2,
        UNAUTHORIZED: 3,
        MISSING_BILLING_INFO: 4
    },
    
    ApiError
};