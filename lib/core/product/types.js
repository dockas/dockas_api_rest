class ProductError {
    constructor(opts = {}) {
        this.code = opts.code;
        this.message = opts.message;
    }
}

module.exports = {
    ErrorCode: {
        DB_ERROR: 0,
        NOT_FOUND: 1,
        INVALID_SCHEMA: 2
    },

    ProductError,

    Data: (data) => {return data;}
};