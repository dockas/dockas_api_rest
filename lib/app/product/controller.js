let lodash          = require("lodash"),
    ProductSrv      = require("services/product"),
    PriceSrv        = require("services/price"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate");

// Instantiate the logger factory.
let Logger = new LoggerFactory("product.ctrl");

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

        // Set creator as current user.
        data.creator = req.uid;

        // Try to create a new product.
        try {
            result = await ProductSrv.client.create(
                new ProductSrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("product service create error", error);
            return res.serverError(error);
        }

        // @TODO : Create a new price with the created product to
        // prevent this to be doing from webapp.

        logger.info("product service create success", result);
        res.success(result);
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new ProductSrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await ProductSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("product service find error", error);
            return res.serverError(error);
        }

        logger.info("product service find success", {
            count: records.length
        });

        // Populate
        populate(records, lodash.flatten([req.query.populate]), {
            "tags": require("services/tag"),
            "creator": require("services/user"),
            "images": require("services/file"),
            "owners": require("services/user")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records);
        });
    }

    /**
     * This function find records in the system by it's name id.
     */
    static async findByNameId(req, res) {
        let record,
            logger = Logger.create("findByNameId", req.trackId);

        logger.info("enter", req.params);

        // Try to find records
        try {
            record = await ProductSrv.client.findByNameId(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("product service find error", error);
            return res.serverError(error);
        }

        logger.info("product service find success", {record});

        // Populate record
        populate([record], lodash.flatten([req.query.populate]), {
            "tags": require("services/tag"),
            "creator": require("services/user"),
            "images": require("services/file"),
            "owners": require("services/user")
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

        // Try to update user profile.
        try {
            result = await ProductSrv.client.update(
                req.params.id,
                new ProductSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("product service update error", error);
            return res.serverError(error);
        }

        logger.info("product service update success", result);
        res.success(true);
    }

    /**
     * This function updates the price of a product.
     */
    static async updatePrice(req, res) {
        let data = req.body,
            logger = Logger.create("updatePrice", req.trackId);

        logger.info("enter", req.body);

        // Set creator as current user.
        data.creator = req.uid;
        data.product = req.params.id;

        // Try to create a new price for the product.
        try {
            await PriceSrv.client.create(
                new PriceSrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("price service create error", error);
            return res.serverError(error);
        }

        // Try to update product with new priceValue.
        try {
            await ProductSrv.client.update(
                req.params.id,
                new ProductSrv.types.Data({
                    priceValue: data.value,
                    currencySymbol: data.currencySymbol,
                    currencyCode: data.currencyCode
                }),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("product service update error", error);
            return res.serverError(error);
        }

        res.success();
    }
};
