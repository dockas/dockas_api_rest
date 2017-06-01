let Joi                 = require("joi"),
    moment              = require("moment"),
    {aqlQuery}          = require("arangojs"),
    LoggerFactory       = require("common-logger"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("tag");

module.exports = class UpdateHandler {
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.db = opts.db;
        this.collection = this.db.collection(opts.collection);
    }

    async update(
        id,
        data,
        trackId
    ) {
        let valid,
            result,
            logger = Logger.create("update", trackId),
            schema = Model.Schema;

        logger.info("enter", {id,data});

        // Validate data schema
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.TagError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data.updatedAt = moment().toISOString();

        // Try to update collection
        try {
            let cursor = await this.db.query(aqlQuery`
                UPDATE ${id} WITH ${data} IN ${this.collection}
                RETURN NEW
            `);

            result = await cursor.next();

            logger.info("collection update success", result);
        }
        catch(error) {
            logger.error("collection update error", error.message);

            throw new Types.TagError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        return result;
    }
};
