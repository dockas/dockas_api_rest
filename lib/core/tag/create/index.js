let Joi                 = require("joi"),
    moment              = require("moment"),
    //lodash              = require("lodash"),
    {aql}               = require("arangojs"),
    LoggerFactory       = require("common-logger"),
    //Generate            = require("utils/generate"),
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
        this.collection = this.db.collection(opts.collection);
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

        // Generate a nameId if not provided.
        /*if(!data.nameId) {
            try {
                data.nameId = await Generate.name({
                    name: data.name,
                    nameKey: "nameId",
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
        }*/

        console.log("data", data);

        // Try to insert to collection
        try {
            let query = aql`INSERT ${data} IN ${this.collection} RETURN NEW`;

            console.log("query", query);

            let cursor = await this.db.query(query);

            console.log(cursor);

            let results = await cursor.all();
            result = results[0];

            logger.info("db insert success", {results});
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
