let lodash          = require("lodash"),
    TagSrv          = require("services/tag"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("product.utils");

module.exports = class Utils {

    /**
     * This function generate category hash for a product.
     */
    static async generateCategory(product, trackId) {
        let results,
            promises = [],
            logger = Logger.create("generateCategory", trackId);

        logger.info("enter", product);

        // For each selected tags, lets find it's category paths.
        for(let tagId of product.selectedTags) {
            ((tagId) => {
                promises.push(
                    TagSrv.client.findCategoryPaths(tagId).then((results) => {
                        logger.debug("tag findCategoryPaths success", {
                            results,
                            tagId
                        });

                        // Results is an array of paths
                        return results.map((path) => {
                            // Path is an array of tags.
                            // After reverse, leaf tags are shown first.
                            return path.reverse();
                        });
                    })
                );
            })(tagId);
        }

        // @TODO : Maybe we should replace all to some, i.e.,
        // if some category promise is returned, then 
        // process it.
        try {
            results = await Promise.all(promises);
            logger.debug("tag findCategoryPaths all success", {results});
        }
        catch(error) {
            logger.error("tag findCategoryPaths all error", error);
            throw error;
        }

        let levels = [];
        let tagsList = [];
        let tagHashes = [];

        // Each result is a list of paths
        for(let paths of results) {
            // Each path is a list of tags
            // 
            // @NOTE : The model we are chasing here is the following:
            // Suppose we have this paths for tag X:
            // 
            //  (1) A <- B <- C <- X
            //  (2) A <- C <- E <- F <- X
            //  (3) A <- C <- G <- X
            // 
            // The resulting levels we want is:
            // 
            //  [{A}, {B}, {C}, {G,E,X}, {F}]
            //  
            for(let path of paths) {
                let currentLevel = 0;

                for(let tag of path) {
                    let tagAlreadyInserted = false;

                    // Search over tagsOfLevel to check wether tag
                    // is already in some level or not.
                    for(let i = 0; i < levels.length; i++) {
                        if(levels[i][tag._id]) {
                            tagAlreadyInserted = true;
                            currentLevel = i;
                            break;
                        }
                    }

                    // If tag was not inserted yet, then let's insert it.
                    if(!tagAlreadyInserted) {

                        // @TODO : Maybe, we should check diference between
                        // levels.length and level. Suppose that
                        // levels.length = 1 and currentLevel = 4 (although i think
                        // this is not possible, because we are inserting tags 
                        // consecutivelly), then we must fill indexes 2,3,4
                        // of levels.
                        if(levels.length <= currentLevel) {
                            levels.push({});
                        }

                        levels[currentLevel][tag._id] = tag;
                    }

                    // Pass to next level.
                    currentLevel++;
                }
            }
        }

        logger.debug("levels", levels);

        // Now, let's arrange tags in levels and generate tag hashes.
        for(let tags of levels) {
            tags = Object.values(tags);

            logger.debug("process level", {tags});

            tags = lodash.orderBy(tags, [(tag) => { return tag.priority; }], ["desc"]);

            for(let tag of tags) {
                let prioritySymbols = lodash.repeat("#", tag.priority);
                let nameId = tag.nameId.replace(/-/g, "");

                tagHashes.push(`${prioritySymbols}${nameId}`);
                tagsList.push(tag._id);
            }
        }

        logger.debug("tagsList", tagsList);
        logger.debug("tagHashes", tagHashes);

        return {
            tags: tagsList,
            category: tagHashes.join("")||"~"
        };
    }
};