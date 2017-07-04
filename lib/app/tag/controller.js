let TagSrv          = require("services/tag"),
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
        let tag,
            tagNameId,
            promises = [],
            tagResultsMap = {},
            tagCategoriesMap = {},
            successCount = 0,
            errorCount = 0,
            logger = Logger.create("createFromCsv", req.trackId);
        
        logger.info("enter");

        // Parse tags from CSV
        let tags = CSV.toJson(req.body.csv);
        
        // First insert all tags to db
        for(tag of tags) {
            ((tag) => {
                // If tag have "categories" field,
                // then extract it to tagCategoriesMap.
                if(tag.categories) {
                    tagCategoriesMap[tag.nameId] = tag.categories;
                }

                tag.creator = req.uid;
                delete tag.categories;

                promises.push(
                    TagSrv.client.create(
                        new TagSrv.types.Data(tag),
                        logger.trackId
                    ).then((result) => {
                        successCount++;

                        // Register tag id to tagResultsMap.
                        tagResultsMap[tag.nameId] = result._id;
                        logger.debug(`tag ${tag.nameId} created`);

                        return result;
                    })
                    .catch((error) => {
                        errorCount++;
                        return error;
                    })
                );
            })(tag);
        }

        try {
            await Promise.all(promises);
            logger.info("tag service create success", tagResultsMap);
        }
        catch(error) {
            logger.error("tag service create error", error);
            return res.serverError(error);
        }

        // Then create category edges between tags
        promises = [];

        for(tagNameId of Object.keys(tagCategoriesMap)) {
            if(!tagResultsMap[tagNameId]) {continue;}

            let categoryTagNameIds = tagCategoriesMap[tagNameId].replace(/ ?; ?/,";").split(";");

            // Iterate over all category tags of the current tag.
            for(let categoryTagNameId of categoryTagNameIds) {
                if(!tagResultsMap[categoryTagNameId]){continue;}

                ((tagNameId,categoryTagNameId) => {
                    promises.push(
                        TagSrv.client.createCategoryEdge(
                            new TagSrv.types.CategoryEdgeData({
                                _from: tagResultsMap[tagNameId],
                                _to: tagResultsMap[categoryTagNameId]
                            }),
                            logger.trackId
                        ).then((result) => {
                            logger.debug(`category edge ${tagNameId} -> ${categoryTagNameId} created`, result);
                            return result;
                        })
                        .catch((error) => {
                            logger.error(`category edge ${tagNameId} -> ${categoryTagNameId} create error`, error.message);
                            return error;
                        })
                    );
                })(tagNameId,categoryTagNameId);
            }
        }

        try {
            let results = await Promise.all(promises);
            logger.info("tag service createCategoryEdge success", results);
        }
        catch(error) {
            logger.error("tag service createCategoryEdge error", error);
            return res.serverError(error);
        }

        res.success({
            successCount,
            errorCount,
            ids: Object.values(tagResultsMap)
        });
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new TagSrv.types.Query(req.query);

        logger.info("enter", {
            query: req.query, 
            incFindCount: req.incFindCount
        });

        // Try to find records
        try {
            records = await TagSrv.client.find(query, logger.trackId, req.incFindCount);
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
     * This function increment the finCount of a tag.
     */
    static async incFindCount(req, res) {
        let result,
            logger = Logger.create("incFindCount", req.trackId);

        logger.info("enter", req.params);

        // Try to update user profile.
        try {
            result = await TagSrv.client.incFindCount(
                req.params.id,
                logger.trackId
            );
            
            logger.info("tag service incFindCount success", result);
        }
        catch(error) {
            logger.error("tag service incFindCount error", error);
            return res.serverError(error);
        }

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
