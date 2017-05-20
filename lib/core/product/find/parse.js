let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    lodash          = require("lodash");

let Logger = new LoggerFactory("product");

/**
 * This function parse a search query into mongo db query.
 *
 * @since 0.0.0
 *
 * @param {object} query
 *     The allowed find query attributes object.
 * @param {list<string>} query._id
 *     A list of ids to restrict the search.
 * @param {list<string>} query.creator
 *     A list of creator ids to restrict the search.
 * @param {string} query.name
 *     A regex tag name to restrict the search.
 * @param {object} createdAt
 *     A date range to restrict search by createdAt field.
 * @param {list<string>} query.select
 *     A list of tag attributes to be retrieved from the search.
 * @return {object}
 *     Query object in mongodb query syntax.
 */
module.exports = function(query = {}) {
    let logger = Logger.create("parseQuery");
    logger.debug("enter", {query: query});

    let mquery = {};

    var $inFn = function(key, mapFn = (item) => {return item;}) {
        mquery[key] = {
            $in: lodash.map(lodash.flatten([query[key]]), mapFn)
        };
    };

    var $regxFn = function(key) {
        mquery[key] = new RegExp(query[key], "gi");
    };

    if(query._id) { $inFn("_id", (id) => { return Mongo.toObjectID(id); }); }
    if(query.creator) { $inFn("creator"); }
    if(query.brand) { $inFn("brand"); }
    if(query.nameId) { $regxFn("nameId"); }
    if(query.description) { $regxFn("description"); }
    if(query.tags) { mquery.tags = {$all: query.tags}; }

    if(query.createdAt && lodash.size(query.createdAt) > 0) {
        mquery.createdAt = {};

        lodash.forOwn(query.createdAt, (val,key) => {
            mquery.createdAt[`$${key}`] = val;
        });
    }

    if(query.count && lodash.size(query.count) > 0) {
        mquery.count = {};

        lodash.forOwn(query.count, (val,key) => {
            mquery.count[`$${key}`] = parseInt(val);
        });
    }

    if(lodash.isString(query.name)) {
        $regxFn("name");
    } else if(lodash.isObject(query.name) && lodash.size(query.name) > 0) {
        mquery.name = {};

        lodash.forOwn(query.name, (val,key) => {
            mquery.name[`$${key}`] = val;
        });
    }

    if(lodash.isNumber(query.priority)) {
        mquery.priority = query.priority;
    }
    else if(lodash.isObject(query.priority) && lodash.size(query.priority) > 0) {
        mquery.priority = {};

        lodash.forOwn(query.priority, (val,key) => {
            mquery.priority[`$${key}`] = parseInt(val);
        });
    }

    if(query.select) {
        let select = {};

        lodash.forEach(query.select, (sel) => {
            select[sel] = true;
        });

        mquery.select = select;
    }

    // Do not consider deleted rooms
    if(!query.includeDeleted) {
        mquery.deletedAt = {$type: "null"};
    }

    return mquery;
};
