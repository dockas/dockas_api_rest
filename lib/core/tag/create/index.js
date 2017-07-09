let Joi                 = require("joi"),
    moment              = require("moment"),
    //lodash              = require("lodash"),
    {aql}               = require("arangojs"),
    LoggerFactory       = require("common-logger"),
    Generate            = require("utils/generate"),
    Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("tag");

/**
 * The handler class.
 */
module.exports = class CreateHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.db = opts.db;
        this.collection = opts.collection;
        this.categoryEdgeCollection = opts.categoryEdgeCollection;
    }

    /**
     * This function creates a new entity.
     */
    async create(
        data,
        trackId
    ) {
        // Local variables
        let valid,
            result,
            logger = Logger.create("create", trackId),
            schema = Model.Schema;

        logger.info("enter", {data});

        // Validate data schema
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.TagError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        logger.debug("valid data", valid.value);

        // Add meta infos
        data = valid.value;
        data.createdAt = moment().toISOString();
        data.deletedAt = null;

        // Generate a nameId if not provided.
        if(!data.nameId) {
            try {
                data.nameId = await Generate.nameWithArango({
                    name: data.name,
                    nameKey: "nameId",
                    db: this.db,
                    collection: this.collection
                });

                logger.debug("generate name success", {nameId: data.nameId});
            }
            catch(error) {
                logger.error("generate name error", error);

                throw new Types.TagError({
                    code: Types.ErrorCode.DB_ERROR,
                    message: error.message
                });
            }
        }

        // Try to insert to collection
        try {
            let cursor = await this.db.query(aql`
                INSERT ${data} IN ${this.collection} 
                RETURN NEW
            `);

            result = await cursor.next();

            logger.info("db insert success", result);
        }
        catch(error) {
            logger.error("db insert error", error.message);

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Create the category edges.
        let promises = [];

        for(let category of data.categories||[]) {
            let edge = {
                _from: result._id,
                _to: category
            };

            promises.push(
                this.db.query(aql`
                    INSERT ${edge} IN ${this.categoryEdgeCollection} 
                    RETURN NEW
                `)
            );
        }

        try {
            let edges = await Promise.all(promises);
            logger.info("db insert edge success", edges);
        }
        catch(error) {
            logger.error("db insert edge error", error.message);
        }

        // Notify all users about tag creation
        Socket.shared.emit("tag:created", {result});

        return result;
    }

    async createCategoryEdge(
        data,
        trackId
    ) {
        let valid,
            result,
            logger = Logger.create("createCategoryEdge", trackId),
            schema = Model.CategoryEdgeSchema;

        logger.info("enter", {data});

        // Validate data schema
        valid = Joi.validate(data, schema);
        data = valid.value;

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.TagError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        logger.debug("valid data", {data});

        // Add meta infos
        data.createdAt = moment().toISOString();
        data.deletedAt = null;

        // Try to insert to collection
        try {
            let cursor = await this.db.query(aql`
                INSERT ${data} IN ${this.categoryEdgeCollection} 
                RETURN NEW
            `);

            result = await cursor.next();

            logger.info("db insert success", result);
        }
        catch(error) {
            logger.error("db insert error", error.message);

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        return result;  
    }
};
