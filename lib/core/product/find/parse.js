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
    if(query.summary) { $regxFn("name"); }
    if(query.description) { $regxFn("description"); }

    if(query.createdAt && lodash.size(query.createdAt) > 0) {
        mquery.createdAt = {};

        if(query.createdAt.lower) {
            mquery.createdAt.$gte = query.createdAt.lower;
        }
        if(query.createdAt.upper) {
            mquery.createdAt.$lte = query.createdAt.upper;
        }
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
