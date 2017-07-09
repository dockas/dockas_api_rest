let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    {aql}               = require("arangojs"),
    LoggerFactory       = require("common-logger"),
    Kafka               = require("utils/kafka"),
    Socket              = require("utils/socket"),
    Generate            = require("utils/generate"),
    Types               = require("../types"),
    Model               = require("./model");

let Logger = new LoggerFactory("tag");

module.exports = class UpdateHandler {
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.db = opts.db;
        this.collection = opts.collection;
        this.categoryEdgeCollection = opts.categoryEdgeCollection;
    }

    async update(
        id,
        data,
        trackId
    ) {
        let valid,
            result,
            collection = this.collection,
            categoryEdgeCollection = this.categoryEdgeCollection,
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
        data = valid.value;
        data.updatedAt = moment().toISOString();

        // Regenerate nameId
        if(data.name && !data.nameId) {
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

        // Try to update collection
        try {
            let cursor = await this.db.query(aql`
                FOR d IN ${collection}
                FILTER d._key == ${id}
                UPDATE d WITH ${data} IN ${collection}
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

        // If categories was updated, then regenerate the edges.
        if(data.categories) {
            let edges;

            // Find current edges.
            try {
                let cursor = this.db.query(aql`
                    FOR d IN ${categoryEdgeCollection}
                    FILTER d._from == ${id}
                    RETURN d
                `);

                edges = await cursor.all();

                logger.info("collection find category edges success", edges);
            }
            catch(error) {
                logger.error("collection find category edges error", error);
            }

            let destIdToKey = lodash.reduce(edges, (result, edge) => {
                result[edge._to] = edge._key;
                return result;
            }, {});

            let destIds = lodash.keys(destIdToKey);

            let edgesToRemove = lodash.map(lodash.difference(destIds, data.categories), (id) => {
                return destIdToKey[id];
            });

            let destToAdd = lodash.difference(data.categories, destIds);

            // Remove edges.
            if(edgesToRemove && edgesToRemove.length) {
                try {
                    await this.db.query(aql`
                        FOR key IN ${edgesToRemove}
                        REMOVE {_key: key} IN ${categoryEdgeCollection}
                        RETURN OLD
                    `);

                    logger.info("collection edges remove success");
                }
                catch(error) {
                    logger.error("collection edges remove error", error);
                }
            }

            // Add new edges
            if(destToAdd && destToAdd.length) {
                let promises = [];

                for(let destId of destToAdd) {
                    let edge = {
                        _from: result._id,
                        _to: destId
                    };

                    promises.push(
                        this.db.query(aql`
                            INSERT ${edge} IN ${this.categoryEdgeCollection} 
                            RETURN NEW
                        `)
                    );
                }

                try {
                    let addedEdges = await Promise.all(promises);
                    logger.info("db insert edge success", addedEdges);
                }
                catch(error) {
                    logger.error("db insert edge error", error.message);
                }
            }
        }

        // Notify the system about tag update
        Kafka.emit("tag:updated", {
            tag: result,
            updatedKeys: Object.keys(data)
        });

        // Notify all users about the change.
        Socket.shared.emit("tag:updated", {
            result,
            updatedKeys: Object.keys(data)
        });

        return result;
    }

    async incFindCount(
        id,
        trackId
    ) {
        let result,
            collection = this.collection,
            logger = Logger.create("incFindCount", trackId);

        logger.info("enter", {id});

        try {
            let query = aql`
                FOR d IN ${collection}
                FILTER d._key == ${id}
                UPDATE d WITH {findCount: d.findCount+1} IN ${collection}
                RETURN NEW
            `;

            logger.debug("query", query);

            let cursor = await this.db.query(query);
            result = await cursor.next();

            logger.debug("tags incFindCount success", result);
        }
        catch(error) {
            logger.error("tag incFindCount error", error.message);
        }

        return result;
    }
};
