let {aql}           = require("arangojs"),
    LoggerFactory   = require("common-logger"),
    lodash          = require("lodash");

let Logger = new LoggerFactory("product");

function compOperatorLabelToSymbol (operator) {
    switch(operator) {
        case "gt": return ">";
        case "lt": return "<";
        case "gte": return ">=";
        case "lte": return "<=";
        default: throw new Error("not a valid operator");
    }
}

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
    logger.debug("enter", {query});

    /**
     * FOR r IN tags
     *     FILTER r._id IN ${ids}
     */
    // Filters list.
    let sort="", limit="";
    let filters = [];
    let select = "doc";

    // Add an IN filter
    let $inFn = (key) => {
        let items = lodash.flatten([query[key]]);

        items = items.map((item) => {
            if(lodash.isString(item)) { return `'${item}'`; }
            return item;
        });

        filters.push(`doc.${key} IN [${items.join(",")}]`);
    };

    // Add regex filter
    let $regexFn = (key) => {
        filters.push(`doc.${key} LIKE '%${query[key]}%'`);
    };

    if(query._id) { $inFn("_id"); }
    if(query._key) { $inFn("_key"); }
    if(query.creator) { $inFn("creator"); }
    if(query.name) { $regexFn("name"); }
    if(query.nameId) { $inFn("nameId"); }

    if(query.createdAt && lodash.size(query.createdAt) > 0) {
        lodash.forOwn(query.createdAt, (val,key) => {
            filters.push(`doc.createdAt ${compOperatorLabelToSymbol(key)} ${val}`);
        });
    }

    if(query.select) {
        let fields = [];

        lodash.forEach(query.select, (sel) => {
            fields.push(`${sel}: doc.${sel}`);
        });

        select = `{${fields.join(",")}}`;
    }

    if(query.sort) {
        let sortList = [];

        for(let field of Object.keys(query.sort)) {
            let direction = query.sort[field] > 0?"ASC":"DESC";
            sortList.push(`SORT doc.${field} ${direction}`);
        }

        if(sortList.length) {
            sort = sortList.join("");
        }
    }

    if(query.limit) {
        limit = `LIMIT ${query.limit}`;
    }

    // Do not consider deleted rooms
    if(!query.includeDeleted) {
        filters.push("doc.deletedAt == null");
    }

    let dbquery = `
        FOR doc IN tags 
        FILTER ${filters.join(" && ")}
        ${sort}
        ${limit}
        RETURN ${select}
    `;

    logger.debug("db query", {dbquery});

    return dbquery;
};
