let lodash          = require("lodash"),
    TagSrv          = require("services/tag"),
    LoggerFactory   = require("common-logger"),
    CSV             = require("utils/csv");

// Instantiate the logger factory.
let Logger = new LoggerFactory("tag.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    /**
     * This function creates a new record.
     */
    static async create(req, res) {
        let result,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);

        // Set creator as current user.
        data.creator = req.uid;

        // Try to create a new entity.
        try {
            result = await TagSrv.client.create(
                new TagSrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("tag service create error", error);
            return res.serverError(error);
        }

        logger.info("tag service create success", result);
        res.success(result);
    }

    /**
     * This function create multiple tag from a csv string.
     */
    static async createFromCsv(req, res) {
        let successCount = 0,
            errorCount = 0,
            logger = Logger.create("createFromCsv", req.trackId);
        
        logger.info("enter");

        // This function builds the tag tree.
        let buildTagTree = (nameId, tagMap, tagTree) => {
            logger.debug(`buildTagTree : ${nameId}`, {tagTree, tag: tagMap[nameId]});

            if(lodash.isEmpty(tagMap[nameId].categories)) {
                logger.debug(`buildTagTree : ${nameId} : tag has no categories`);

                if(tagTree.length < 1) {tagTree.push({});}
                tagTree[0][nameId] = true;

                return [0];
            }

            let newLevels = [];
            let categories = tagMap[nameId].categories;

            for(let category of categories) {
                let levels = buildTagTree(category, tagMap, tagTree);

                logger.debug(`buildTagTree : ${nameId} : category ${category}`, {levels});

                for(let level of levels) {
                    level += 1;

                    if(tagTree.length <= level) {
                        tagTree.push({});
                    }

                    tagTree[level][nameId] = true;
                    newLevels.push(level);
                }   
            }

            return newLevels;
        };

        // @TODO : Check if body has csv field.
        // @TODO : Check if csv is valid.
        let resultsMap = {};
        let tag, tagMap = {}, tagTree = [];
        let tags = CSV.toJson(req.body.csv);
        tags = lodash.flatten([tags]);

        logger.debug("tags", tags);

        // Build tag map.
        for(tag of tags) { 
            if(!lodash.isEmpty(tag.categories)) {
                tag.categories = tag.categories.replace(/ ?; ?/g, ";").split(";");
            }
            else { delete tag.categories; }
            
            tagMap[tag.nameId] = tag;
        }

        logger.debug("tagMap", tagMap);

        // Build tag tree.
        for(tag of tags) { buildTagTree(tag.nameId, tagMap, tagTree); }
        logger.debug("tagTree", tagTree);

        // For each tagTree level we gonna create the tags.
        for(let tagLevel of tagTree) {
            logger.debug("tagLevel", {tagLevel});

            let tagNameIds = Object.keys(tagLevel);
            let promises = [];

            logger.debug("tagNameIds", {tagNameIds});

            for(let tagNameId of tagNameIds) {
                tag = tagMap[tagNameId];
                tag.creator = req.uid;

                // If tag is already created, then skip.
                if(resultsMap[tagNameId]) { continue; }

                // Populate categories.
                if(tag.categories) {
                    for(let i = 0; i < tag.categories.length; i++) {
                        tag.categories[i] = resultsMap[tag.categories[i]];
                    }
                }
            
                // Create the tag.
                ((tag) => {
                    promises.push(
                        TagSrv.client.create(
                            new TagSrv.types.Data(tag),
                            logger.trackId
                        ).then((result) => {
                            successCount++;

                            resultsMap[tag.nameId] = result;
                            logger.debug(`tag ${tag.nameId} created`, resultsMap);

                            return result;
                        })
                        .catch((error) => {
                            errorCount++;
                            return error;
                        })
                    );
                })(tag);
            }

            // Await all tags of this level to be created,
            // then move on to next level.
            try {
                let results = await Promise.all(promises);

                logger.info("tag service create success", results);
            }
            catch(error) {
                logger.error("tag service create error", error);
                return res.serverError(error);
            }

            logger.info("resultsMap", {resultsMap});
        }

        res.success({
            successCount,
            errorCount,
            ids: Object.values(resultsMap)
        });
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new TagSrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await TagSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("tag service find error", error);
            return res.serverError(error);
        }

        logger.info("tag service find success", {
            count: records.length
        });

        res.success(records);
    }

    /**
     * This function updates a record.
     */
    static async update(req, res) {
        let result,
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // Try to update user profile.
        try {
            result = await TagSrv.client.update(
                req.params.id,
                new TagSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("tag service update error", error);
            return res.serverError(error);
        }

        logger.info("tag service update success", result);
        res.success(result);
    }

    /**
     * This function removes a record.
     */
    static async remove(req, res) {
        let result,
            logger = Logger.create("remove", req.trackId);

        logger.info("enter", req.body);

        // Try to remove a record.
        try {
            result = await TagSrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("tag service remove error", error);
            return res.serverError(error);
        }

        logger.info("tag service remove success", result);
        res.success(true);
    }
};
