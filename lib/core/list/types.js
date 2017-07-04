let lodash = require("lodash");

class ListError {
    constructor(data) {
        lodash.assign(this, data, {name: "ListError"});
    }
}

class Data {
    constructor(data) {
        lodash.assign(this, data);
    }
}

class ItemData {
    constructor(data) {
        lodash.assign(this, data);
    }
}

class Query {
    constructor(data) {
        lodash.assign(this, data);
        delete this.populate;
    }
}

module.exports = {
    ErrorCode: {
        DB_ERROR: 0,
        NOT_FOUND: 1,
        INVALID_SCHEMA: 2,
        NAME_ID_DUPLICATED: 3,
        ITEM_NOT_FOUND: 4
    },

    Status: {
        PUBLIC: "public",
        PRIVATE: "private"
    },

    Type: {
        DEFAULT: "default",
        RECIPE: "recipe"
    },

    Recurrence: {
        "NONE": "none",
        "WEEKLY": "weekly",
        "BIWEEKLY": "biweekly",
        "MONTHLY": "monthly"
    },

    ListError,
    Data,
    ItemData,
    Query
};
