let lodash = require("lodash");

class ApiError {
    constructor(data) {
        lodash.assign(this, data);
    }
}

module.exports = {
    ErrorCode: {
        USER_ALREADY_EXISTS: 0,
        INVITATION_ALREADY_USED: 1
    },
    
    ApiError
};