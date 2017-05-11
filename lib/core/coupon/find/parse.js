let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    lodash          = require("lodash");

let Logger = new LoggerFactory("coupon");

module.exports = class Parser {

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
    static parseQuery(query = {}) {
        let logger = Logger.create("parseQuery");
        logger.debug("enter", {query: query});

        let mquery = {};

        var $inFn = function(key, mapFn = (item) => {return item;}) {
            mquery[key] = {
                $in: lodash.map(lodash.flatten([query[key]]), mapFn)
            };
        };

        var $allFn = function(key) {
            mquery[key] = {
                $all: lodash.flatten([query[key]])
            };
        };

        var $regxFn = function(key) {
            mquery[key] = new RegExp(query[key], "gi");
        };

        if(query._id) { $inFn("_id", (id) => { return Mongo.toObjectID(id); }); }
        if(query.nameId) { $regxFn("nameId"); }
        if(query.users) { $allFn("users"); }
        if(query.products) { $allFn("products"); }
        if(query.brands) { $allFn("brands"); }
        if(query.appliers) { $allFn("appliers"); }
        if(query.type) { mquery.type = query.type; }

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
    }

    static parseSort(sort) {
        let logger = Logger.create("parseSort");
        console.log("@@@@ parseSort", sort);

        let parsedSort = {};

        lodash.forOwn(sort, (value, key) => {
            console.log("@@@@ parseSort : key, value", {key,value});

            try {parsedSort[key] = parseInt(value);}
            catch(error){logger.error("parseInt error");}
        });

        console.log("@@@@ parseSort : result", parsedSort);

        return parsedSort;
    }
};
