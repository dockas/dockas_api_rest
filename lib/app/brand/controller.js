let lodash          = require("lodash"),
    BrandSrv        = require("services/brand"),
    CompanySrv      = require("services/company"),
    UserSrv         = require("services/user"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate"),
    CSV             = require("utils/csv"),
    Email           = require("utils/email");

// Instantiate the logger factory.
let Logger = new LoggerFactory("brand.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    /**
     * This function creates a new record.
     */
    static async create(req, res) {
        let result,
            promises = [],
            creator = req.user,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);

        // Process data creator
        data.creator = data.creator || req.user._id;

        // If data has status and status is other than
        // not approved, then check wether user is admin.
        if(data.status 
        && data.status != BrandSrv.types.STATUS_NOT_APPROVED
        && req.user.roles.indexOf("admin") < 0) {
            return res.serverError(new BrandSrv.types.BrandError({
                code: BrandSrv.types.ErrorCode.UNAUTHORIZED_STATUS,
                message: "You do not have permission to set status to not approved"
            }));
        }

        // If user is not admin, then override the creator field.
        if(req.user.roles.indexOf("admin") < 0) {
            data.creator = req.user._id;
        }
        else if(data.creator != req.user._id) {
            creator = await UserSrv.client.findById(data.creator);
        }

        // If creator has reached max brand count, then prevent brand
        // creation.
        if(creator.maxBrandCount >= 0 && creator.brandCount == creator.maxBrandCount) {
            return res.serverError(new BrandSrv.types.BrandError({
                code: BrandSrv.types.ErrorCode.MAX_BRAND_COUNT_REACHED,
                message: "Creator has reached the maximum number of brands."
            }));
        }

        // Let's rebuild the owners to include creator as the
        // main one and let's evaluate owner status.
        let owners = [{
            user: data.creator,
            status: BrandSrv.types.OWNER_STATUS_APPROVED,
            role: BrandSrv.types.OWNER_ROLE_ADMIN
        }];

        for(let owner of data.owners||[]) {
            if(owner.user == data.creator){continue;}

            ((owner) => {
                // Let's set the status for each owner.
                promises.push(
                    UserSrv.client.findById(owner.user)
                    .then((user) => {
                        if(user.brandCount == user.maxBrandCount) {
                            owner.status = BrandSrv.types.OWNER_STATUS_MAX_BRAND_COUNT_REACHED;
                        }

                        owners.push(owner);
                    })
                );
            })(owner);
        }

        // Await all owners to be verified, then set new owners array to data.
        try {
            await Promise.all(promises);
            data.owners = owners;

            logger.info("owners brandCount validation success", owners);
        }
        catch(error) {
            logger.error("owners brandCount validation error", error);
        }

        // Try to create a new entity.
        try {
            result = await BrandSrv.client.create(
                new BrandSrv.types.Data(data),
                logger.trackId
            );

            logger.info("brand service create success", result);
        }
        catch(error) {
            logger.error("brand service create error", error);
            return res.serverError(error);
        }

        // Send new_brand email to admins.
        populate([lodash.cloneDeep(result)], ["owners[].user","mainProfileImage"], {
            "owners[].user": require("services/user"),
            "mainProfileImage": require("services/file")
        }).then((results) => {
            logger.debug("service populate success");
            Email.shared.sendToAdmins("email:admin_notification", {
                subject: "new_brand",
                data: results[0]
            });
        });

        // Return 
        res.success(result);
    }

    /**
     * This function create multiple brands from a csv string.
     */
    static async createFromCsv(req, res) {
        let results,
            companies = {},
            successCount = 0,
            errorCount = 0,
            logger = Logger.create("createFromCsv", req.trackId);
        
        logger.info("enter");

        // @TODO : Check if body has csv field.
        // @TODO : Check if csv is valid.

        let brands = CSV.toJson(req.body.csv);
        brands = lodash.flatten([brands]);

        // Collect companies
        for(let brand of brands) {
            companies[brand.company] = true;
        }

        logger.debug("collected data", {
            companies: Object.keys(companies)
        });

        // Find all companies
        try {
            let results = await CompanySrv.client.find({
                nameId: Object.keys(companies)
            });

            companies = lodash.reduce(results, (map, result) => {
                map[result.nameId] = result;
                return map;
            }, {});

            logger.debug("found companies", companies);
        }
        catch(error) {
            return res.serverError(error);
        }

        logger.debug("brands", brands);

        let promises = [];

        for(let brand of brands) {
            let companyId = lodash.get(companies, `${brand.company}._id`),
                erros = [];

            // If company was not found, then report
            // an error.
            if(!companyId) {
                errorCount++;
                logger.error(`company ${brand.company} not found for brand "${brand.name}"`);
                erros.push(`company ${brand.company} not found`);
                continue;
            }

            // Set data
            brand.company = companyId;

            promises.push(
                BrandSrv.client.create(
                    new BrandSrv.types.Data(brand),
                    logger.trackId
                ).then((result) => {
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
            results = await Promise.all(promises);
            logger.info("brand service create success", results);
        }
        catch(error) {
            logger.error("brand service create error", error);
        }

        res.success({
            successCount,
            errorCount,
            results
        });
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new BrandSrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await BrandSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("brand service find error", error);
            return res.serverError(error);
        }

        logger.info("brand service find success", {
            count: records.length
        });

        // Populate
        populate(records, lodash.flatten([req.query.populate]), {
            "owners[].user": require("services/user"),
            "profileImages": require("services/file"),
            "images": require("services/file"),
            "company": require("services/company")
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
            query = new BrandSrv.types.Query(Object.assign(req.query, {
                users: [req.uid]
            }));

        logger.info("enter", {query: req.query});

        // Try to count records
        try {
            count = await BrandSrv.client.count(query, logger.trackId);
        }
        catch(error) {
            logger.error("brand service count error", error);
            return res.serverError(error);
        }

        logger.info("brand service count success", {count});

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
            record = await BrandSrv.client.findById(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("brand service findById error", error);
            return res.serverError(error);
        }

        logger.info("brand service findById success", record);

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "owners": require("services/user"),
            "profileImages": require("services/file"),
            "images": require("services/file"),
            "company": require("services/company")
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
            record = await BrandSrv.client.findByNameId(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("brand service findByNameId error", error);
            return res.serverError(error);
        }

        logger.info("brand service findByNameId success", record);

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "owners": require("services/user"),
            "profileImages": require("services/file"),
            "images": require("services/file"),
            "company": require("services/company")
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
            result = await BrandSrv.client.update(
                req.params.id,
                new BrandSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("brand service update error", error);
            return res.serverError(error);
        }

        logger.info("brand service update success", result);
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
            result = await BrandSrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("brand service remove error", error);
            return res.serverError(error);
        }

        logger.info("brand service remove success", result);
        res.success(result);
    }
};
