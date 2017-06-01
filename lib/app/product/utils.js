let TagSrv          = require("services/tag"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("product.ctrl");

module.exports = class Utils {

    async getNextCategoryTagNameIds(tagIds, {
        key="nameId"
    } = {}) {
        let tag, tags, categoryTags;

        try {
            tags = await TagSrv.client.find({
                [key]: tagIds
            });
        }
        catch(error) {

        }

        // Collect category tags.
        for(tag of tags) {

        }

        for(let id of tagIds) {
            let results, tagChain = [];

            try {
                let results = await TagSrv.client.find({
                    [key]: tags
                });
            }
            catch(error) {

            }


        }
    }

    /**
     * This function expand selected tags to all tag
     * chains and generate a category for this tags.
     */
    async generateCategory(tags, {
        key="nameId",
        trackId=null
    } = {}) {
        let logger = Logger.create("create", trackId);
        logger.info("enter", tags);

        let tagChains = [];

        for(let tag of tags) {
            let tagChain = [];

        }
    }
};