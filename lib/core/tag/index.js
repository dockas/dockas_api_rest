let lodash          = require("lodash"),
    {aql}           = require("arangojs"),
    Arango          = require("utils/arango"),
    Kafka           = require("utils/kafka"),
    Socket          = require("utils/socket"),
    LoggerFactory   = require("common-logger"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find"),
    RemoveHandler   = require("./remove");

let Logger = new LoggerFactory("tag");

module.exports = class Srv {
    /**
     * This static function setups entity db collection.
     */
    static async setupCollection(db) {
        // Local variables
        let collection = db.collection("tags"),
            categoryEdgeCollection = db.edgeCollection("tag_category_edges"),
            logger = Logger.create("setupCollection");

        logger.info("enter");

        // Try to create the collection
        try {
            await collection.create();

            logger.info("collection create success");
        }
        catch(error) {
            logger.error("collection create error", error.message);
        }

        // Try to create the edge collection
        try {
            await categoryEdgeCollection.create();

            logger.info("category edge collection create success");
        }
        catch(error) {
            logger.error("category edge collection create error", error.message);
        }

        // Try to create index on name
        /*try {
            await collection.createIndex("name", {
                unique: true,
                background: true,
                w:1,
                partialFilterExpression: { deletedAt: {$type: "null"} }
            });

            logger.info("collection createIndex on name success");
        }
        catch(error) {
            logger.error("collection createIndex on name error", error);
        }*/
    }

    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";
        let db = this.db = opts.db || Arango.db;
        let collection = this.collection = db.collection(opts.collection || "tags");
        let categoryEdgeCollection = this.categoryEdgeCollection = db.edgeCollection(opts.categoryEdgeCollection || "tag_category_edges");

        this.createHandler = new CreateHandler({db, collection, categoryEdgeCollection, mode});
        this.updateHandler = new UpdateHandler({db, collection, categoryEdgeCollection, mode});
        this.findHandler = new FindHandler({db, collection, categoryEdgeCollection, mode});
        this.removeHandler = new RemoveHandler({db, collection, categoryEdgeCollection, mode});

        Kafka.on("product:created", this.handleProductCreatedEvent.bind(this));
        Kafka.on("product:updated", this.handleProductUpdatedEvent.bind(this));
    }

    /**
     * This function creates a new tag.
     */
    async create(
        data,
        trackId
    ) { 
        return await this.createHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function creates a category edge between tags..
     */
    async createCategoryEdge(
        data,
        trackId
    ) { 
        return await this.createHandler.createCategoryEdge(
            data,
            trackId
        );
    }

    /**
     * This function updates a tag by it's id.
     */
    async update(
        id,
        data,
        trackId
    ) {
        return await this.updateHandler.update(
            id,
            data,
            trackId
        );
    }

    /**
     * This function increment the findCount of a tag.
     */
    async incFindCount(
        id,
        trackId
    ) {
        return await this.updateHandler.incFindCount(
            id,
            trackId
        );
    }

    /**
     * This function removes a tag by it's id.
     */
    async remove(
        id,
        trackId
    ) {
        return await this.removeHandler.remove(
            id,
            trackId
        );
    }

    /**
     * This function find tags that match some query.
     */
    async find(
        query,
        trackId
    ) {
        return await this.findHandler.find(
            query,
            trackId
        );
    }

    /**
     * This function finds a tag by it's id.
     */
    async findById(
        id,
        trackId
    ) {
        return await this.findHandler.findById(
            id,
            trackId
        );
    }

    /**
     * This function finds a tag by it's nameId.
     */
    async findByNameId(
        nameId,
        trackId
    ) {
        return await this.findHandler.findByNameId(
            nameId,
            trackId
        );
    }

    async findCategoryPaths(
        id,
        trackId
    ) {
        return await this.findHandler.findCategoryPaths(
            id,
            trackId
        );
    }

    /**
     * This function handles product created event.
     */
    async handleProductCreatedEvent(message={}) {
        let result,
            {product,trackId} = message,
            collection = this.collection,
            logger = Logger.create("handleProductCreatedEvent", trackId);

        logger.info("enter", {product});

        if(product.tags && product.tags.length) {
            try {
                let cursor = await this.db.query(aql`
                    FOR d IN ${collection}
                    FILTER d._id IN ${product.tags}
                    UPDATE d WITH {productCount: d.productCount+1} IN ${collection}
                    RETURN NEW
                `);

                result = await cursor.all();

                logger.info("collection increment update success", result);
            }
            catch(error) {
                return logger.error("collection increment update error", error);
            }

            // Notify all users about the change.
            Socket.shared.emit("tags:updated", {
                result,
                updatedKeys: ["productCount"]
            });
        }
    }

    /**
     * This function handles product updated event.
     */
    async handleProductUpdatedEvent(message={}) {
        let result,
            {product,updatedKeys,oldData,trackId} = message,
            collection = this.collection,
            logger = Logger.create("handleProductUpdatedEvent", trackId);

        logger.info("enter", {product,updatedKeys,oldData});

        // Update just when tags changed.
        if(updatedKeys.indexOf("tags") < 0) {return;}

        // Let's check differences.
        let tagsToDecrement = lodash.difference(oldData.tags, product.tags);
        let tagsToIncrement = lodash.difference(product.tags, oldData.tags);

        logger.debug("tags to decrement and increment", {tagsToDecrement,tagsToIncrement});

        if(tagsToDecrement && tagsToDecrement.length) {
            try {
                let cursor = await this.db.query(aql`
                    FOR d IN ${collection}
                    FILTER d._id IN ${tagsToDecrement}
                    UPDATE d WITH {productCount: d.productCount-1} IN ${collection}
                    RETURN NEW
                `);

                result = await cursor.all();
                logger.info("collection decrement update success", result);

                // Notify all users about the change.
                Socket.shared.emit("tags:updated", {
                    result,
                    updatedKeys: ["productCount"]
                });
            }
            catch(error) {
                logger.error("collection decrement update error", error);
            }
        }

        if(tagsToIncrement && tagsToIncrement.length) {
            try {
                let cursor = await this.db.query(aql`
                    FOR d IN ${collection}
                    FILTER d._id IN ${tagsToIncrement}
                    UPDATE d WITH {productCount: d.productCount+1} IN ${collection}
                    RETURN NEW
                `);

                result = await cursor.all();
                logger.info("collection increment update success", result);

                // Notify all users about the change.
                Socket.shared.emit("tags:updated", {
                    result,
                    updatedKeys: ["productCount"]
                });
            }
            catch(error) {
                logger.error("collection increment update error", error);
            }
        }
    }
};
