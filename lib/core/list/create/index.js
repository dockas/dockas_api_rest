let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    //Socket              = require("utils/socket"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("list");

/**
 * The handler class.
 */
module.exports = class CreateHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.collection = opts.collection;
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

        logger.info("enter", {data: data});

        // Validate data schema
        valid = Joi.validate(data, schema);
        data = valid.value;

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.ListError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        logger.debug("valid data", {data: data});

        // Add meta infos
        data.createdAt = moment().toISOString();
        data.deletedAt = null;

        // Try to generate random nameId
        try {
            data.nameId = await this._generateNameId(data.name);
        }
        catch(error) { return error; }

        // Try to insert to collection
        try {
            result = await this.collection.insertOne(data);
            logger.info("collection insertOne success", {id: result.insertedId});
        }
        catch(error) {
            logger.error("collection insertOne error", error);

            throw new Types.ListError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Return id.
        return lodash.toString(result.insertedId);
    }

    /**
     * This function generates a random available list nameId.
     *
     * @TODO : Maybe this function should be globally available
     * to other modules.
     */
    async _generateNameId(name) {
        let records,
            nameId = lodash.kebabCase(name),
            logger = Logger.create("_generateNameId");

        logger.info("enter", {name});

        try {
            records = await this.collection.find({
                nameId: new RegExp(nameId, "gi")
            }, {nameId: 1}).toArray();
        }
        catch(error) {
            logger.error("collection find error", error);

            throw new Types.ListError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        logger.debug("find nameIds success", {records});

        // Iterate over users to get available nameId.
        let count = 0;
        let unavailableNameIds = lodash.reduce(records, (map, record) => {
            map[record.nameId] = 1;
            return map;
        }, {});

        logger.debug("unavailableNameIds", unavailableNameIds);

        while(count < 10000000) {
            let inc = count > 0 ? `-${count}` : "";
            let tryNameId = `${nameId}${inc}`;

            logger.debug(`check nameId = ${tryNameId}`);

            if(!unavailableNameIds[tryNameId]) {
                logger.debug(`nameId "${tryNameId}" available`);
                return tryNameId;
            }

            count++;
        }

        throw new Types.ListError({
            code: Types.ErrorCode.DB_ERROR,
            message: "could not generate nameId"
        });
    }
};
