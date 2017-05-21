let lodash          = require("lodash"),
    CompanySrv      = require("services/company"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate"),
    CSV             = require("utils/csv");

// Instantiate the logger factory.
let Logger = new LoggerFactory("company.ctrl");

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

        // Try to create a new entity.
        try {
            result = await CompanySrv.client.create(
                new CompanySrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("company service create error", error);
            return res.serverError(error);
        }

        logger.info("company service create success", result);
        res.success(result);
    }

    /**
     * This function create multiple brands from a csv string.
     */
    static async createFromCsv(req, res) {
        let successCount = 0,
            errorCount = 0,
            logger = Logger.create("createFromCsv", req.trackId);
        
        logger.info("enter");

        // @TODO : Check if body has csv field.
        // @TODO : Check if csv is valid.

        let companies = CSV.toJson(req.body.csv);
        companies = lodash.flatten([companies]);

        logger.debug("companies", companies);

        let promises = [];

        for(let company of companies) {
            promises.push(
                CompanySrv.client.create(
                    new CompanySrv.types.Data(company),
                    logger.trackId
                )
                .then((result) => {
                    successCount++;
                    return result;
                })
                .catch((error) => {
                    errorCount++;
                    return error;
                })
            );
        }

        try {
            let results = await Promise.all(promises);

            logger.info("company service create success", results);
            res.success({
                successCount,
                errorCount,
                results
            });
        }
        catch(error) {
            logger.error("company service create error", error);
            return res.serverError(error);
        }
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new CompanySrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await CompanySrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("company service find error", error);
            return res.serverError(error);
        }

        logger.info("company service find success", {
            count: records.length
        });

        // Populate
        populate(records, lodash.flatten([req.query.populate]), {
            "owners": require("services/user"),
            "profileImages": require("services/file"),
            "images": require("services/file")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records);
        });
    }

    /**
     * This function count records matching a query in the system.
     */
    static async count(req, res) {
        let count,
            logger = Logger.create("count", req.trackId),
            query = new CompanySrv.types.Query(Object.assign(req.query, {
                users: [req.uid]
            }));

        logger.info("enter", {query: req.query});

        // Try to count records
        try {
            count = await CompanySrv.client.count(query, logger.trackId);
        }
        catch(error) {
            logger.error("company service count error", error);
            return res.serverError(error);
        }

        logger.info("company service count success", {count});

        res.success(count);
    }

    /**
     * This function finds a record by it's unique id.
     */
    static async findById(req, res) {
        let record,
            logger = Logger.create("findById", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find records
        try {
            record = await CompanySrv.client.findById(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("company service findById error", error);
            return res.serverError(error);
        }

        logger.info("company service findById success", record);

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "owners": require("services/user"),
            "profileImages": require("services/file"),
            "images": require("services/file")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records[0]);
        });
    }

    /**
     * This function finds a record by it's unique name id.
     */
    static async findByNameId(req, res) {
        let record,
            logger = Logger.create("findByNameId", req.trackId);

        logger.info("enter", {nameId: req.params.id});

        // Try to find records
        try {
            record = await CompanySrv.client.findByNameId(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("company service findByNameId error", error);
            return res.serverError(error);
        }

        logger.info("company service findByNameId success", record);

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "owners": require("services/user"),
            "profileImages": require("services/file"),
            "images": require("services/file")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records[0]);
        });
    }

    /**
     * This function updates a record.
     */
    static async update(req, res) {
        let result,
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // Now try to update the record.
        try {
            result = await CompanySrv.client.update(
                req.params.id,
                new CompanySrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("company service update error", error);
            return res.serverError(error);
        }

        logger.info("company service update success", result);
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
            result = await CompanySrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("company service remove error", error);
            return res.serverError(error);
        }

        logger.info("company service remove success", result);
        res.success(result);
    }
};
