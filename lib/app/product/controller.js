let lodash          = require("lodash"),
    ProductSrv      = require("services/product"),
    PriceSrv        = require("services/price"),
    BrandSrv        = require("services/brand"),
    TagSrv          = require("services/tag"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate"),
    CSV             = require("utils/csv"),
    Kafka           = require("utils/kafka"),
    Notification    = require("utils/notification"),
    Utils           = require("./utils");

// Instantiate the logger factory.
let Logger = new LoggerFactory("product.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {

    constructor() {
        Kafka.on("tag:updated", this.handleTagUpdatedEvent.bind(this));
    }

    /**
     * This function creates a new record.
     */
    async create(req, res) {
        let result,
            brand,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);

        // Set creator as current user.
        data.creator = req.uid;

        // If data has status and status is other than
        // not approved, then check wether user is admin.
        if(data.status 
        && data.status != ProductSrv.types.STATUS_NOT_APPROVED
        && req.user.roles.indexOf("admin") < 0) {
            return res.serverError(new ProductSrv.types.ProductError({
                code: ProductSrv.types.ErrorCode.UNAUTHORIZED_STATUS,
                message: "You do not have permission to set status to not approved"
            }));
        }

        // Validate maxProductCount
        try {
            brand = await BrandSrv.client.findById(data.brand, logger.trackId);
            logger.debug("brand service findById success", brand);
        }
        catch(error) {
            logger.error("brand service findById success", error);
            return res.serverError(error);
        }

        // If creator has reached max product count for the , then prevent brand
        // creation.
        if(brand.maxProductCount >= 0 && brand.productCount == brand.maxProductCount) {
            return res.serverError(new BrandSrv.types.BrandError({
                code: BrandSrv.types.ErrorCode.MAX_PRODUCT_COUNT_REACHED,
                message: "Brand has reached the maximum number of products."
            }));
        }

        // Try to generate category
        if(data.selectedTags && data.selectedTags.length) {
            try {
                let {category,tags} = await Utils.generateCategory(data);

                logger.debug("generateCategory success", {category,tags});

                data.category = category;
                data.tags = tags;
            }
            catch(error) {
                logger.error("generateCategory error", error);
                return res.serverError(error);
            }
        }

        // Try to create a new product.
        try {
            result = await ProductSrv.client.create(
                new ProductSrv.types.Data(data),
                logger.trackId
            );

            logger.info("product service create success", result);
        }
        catch(error) {
            logger.error("product service create error", error);
            return res.serverError(error);
        }

        // @TODO : Create a new price with the created product to
        // prevent this to be doing from webapp.
        try {
            await PriceSrv.client.create(new PriceSrv.types.Data({
                creator: req.uid,
                value: data.priceValue,
                target: result._id,
                type: PriceSrv.types.PriceType.PRODUCT_PRICE
            }), logger.trackId);
        }
        catch(error) {
            logger.error("price service create error", error);
        }

        // Send new_product email to admins.
        populate([lodash.cloneDeep(result)], ["tags","creator","mainProfileImage"], {
            "tags": require("services/tag"),
            "creator": require("services/user"),
            "mainProfileImage": require("services/file")
        }).then((results) => {
            logger.debug("service populate success");

            // Emit notifications
            Notification.emit([{
                channel: "email",
                roles: ["admin"],
                type: "admin:message",
                body: {
                    subject: "new_product",
                    data: Object.assign(results[0], {brand})
                }
            }]);
        });

        // Return product result.
        res.success(result);
    }

    /**
     * This function create multiple products from a csv string.
     */
    async createFromCsv(req, res) {
        let results,
            product,
            selectedTags = {},
            brands = {},
            promises = [],
            errors = [],
            successCount = 0,
            errorCount = 0,
            logger = Logger.create("createFromCsv", req.trackId);

        logger.info("enter");

        // @TODO : Check if body has csv field.
        // @TODO : Check if csv is valid.

        let products = CSV.toJson(req.body.csv);
        products = lodash.flatten([products]);

        logger.debug("products", products);

        // Collect tags and brands
        for(product of products) {
            if(product.brand){
                brands[product.brand] = true;
            }

            // Parse selected tags
            if(lodash.isString(product.selectedTags)) {
                product.selectedTags = product.selectedTags.replace(/ ?; ?/g,";").replace(/;$/,"").split(";");
            }

            // Collect
            for(let tag of product.selectedTags) {
                if(!tag.length){continue;}
                selectedTags[tag] = true;
            }
        }

        logger.debug("collected data", {
            brands: Object.keys(brands),
            tags: Object.keys(selectedTags)
        });

        // First find all tags
        try {
            let results = await TagSrv.client.find({
                nameId: Object.keys(selectedTags)
            });

            selectedTags = lodash.reduce(results, (map, result) => {
                map[result.nameId] = result;
                return map;
            }, {});

            logger.debug("found selected tags", selectedTags);
        }
        catch(error) {
            return res.serverError(error);
        }

        // Then find all brands
        try {
            let results = await BrandSrv.client.find({
                nameId: Object.keys(brands)
            });

            brands = lodash.reduce(results, (map, result) => {
                map[result.nameId] = result;
                return map;
            }, {});

            logger.debug("found brands", brands);
        }
        catch(error) {
            return res.serverError(error);
        }

        // Then create the products
        for(product of products) {
            let brand = product.brand,
                brandId = brand ? lodash.get(brands, `${brand}._id`) : null,
                selectedTagIds = [],
                productErros = [];

            // Get tag ids.
            for(let tagNameId of product.selectedTags) {
                if(!tagNameId.length){continue;}
                
                let tag = selectedTags[tagNameId];

                if(!tag) {
                    logger.error(`tag ${tagNameId} not found for product "${product.name}"`);
                    productErros.push(`tag ${tagNameId} not found`);
                    continue;
                }

                selectedTagIds.push(tag._id);
            }

            logger.debug("collected ids", {
                brandId, selectedTagIds
            });

            // If brand was not found, then report
            // an error.
            if(brand && !brandId) {
                logger.error(`brand ${product.brand} not found for product "${product.name}"`);
                productErros.push(`brand ${product.brand} not found`);
                continue;
            }

            // If there were erros, then prevent product creation.
            if(productErros.length) {
                errorCount++;
                errors.push({
                    product: product.name,
                    errors: productErros
                });

                continue;
            }

            // Set product creator
            product.creator = req.uid;
            product.selectedTags = selectedTagIds;

            // Parse price to integer (cents unity).
            product.priceValue = parseInt((product.priceValue * 100).toFixed(0));

            if(brand && brandId) {product.brand = brandId;}
            else {delete product.brand;}

            // Process priceGroups
            if(!lodash.isEmpty(product.priceGroupCount) && !lodash.isEmpty(product.priceGroupUnity)) {
                product.priceGroups = [{
                    count: product.priceGroupCount,
                    unity: product.priceGroupUnity
                }];
            }

            delete product.priceGroupCount;
            delete product.priceGroupUnity;

            // Pack everithing to create a product.
            ((product) => {
                promises.push(
                    Utils.generateCategory(product)
                    .then((result) => {
                        logger.debug("category hash result", result);

                        product.category = result.category;
                        product.tags = result.tags;

                        // Create the product
                        return ProductSrv.client.create(
                            new ProductSrv.types.Data(product),
                            logger.trackId
                        );
                    })
                    .then((result) => {
                        logger.debug("product created", {result});

                        let price = {
                            creator: req.uid,
                            value: product.priceValue,
                            target: result._id,
                            type: PriceSrv.types.PriceType.PRODUCT_PRICE
                        };

                        successCount++;

                        // Create the price
                        return PriceSrv.client.create(
                            new PriceSrv.types.Data(price),
                            logger.trackId
                        ).then(() => {
                            logger.debug("price created", {result});
                            return result;
                        });
                    })
                );
            })(product);
        }

        try {
            results = await Promise.all(promises);
            logger.debug("product create success", results);
        }
        catch(error) {
            logger.error("product create error", error);
        }

        res.success(results, {
            successCount,
            errorCount,
            errors,
        });
    }

    /**
     * This function find generic records in the system.
     */
    async find(req, res) {
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
            "profileImages": require("services/file"),
            "images": require("services/file"),
            "brand": require("services/brand"),
            "brand.company": require("services/company")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records);
        });
    }

    /**
     * This function find records in the system by it's name id.
     */
    async findByNameId(req, res) {
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
            "profileImages": require("services/file"),
            "images": require("services/file"),
            "brand": require("services/brand"),
            "brand.company": require("services/company")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records[0]);
        });
    }

    /**
     * This function updates a record.
     */
    async update(req, res) {
        let result,
            data = req.body,
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // Generate new nameId
        if(data.name) {
            try {
                data.nameId = await ProductSrv.client.createNameId(data.name, logger.trackId);
                logger.info("product service createNameId success", data.nameId);
            }
            catch(error) {
                logger.error("product service createNameId error", error);
                return res.serverError(error);
            }
        }

        // If user is updating the selectedTags, then
        // regenerate the tags, category and hash. 
        if(data.selectedTags || data.nameId) {
            let product;

            try {
                product = await ProductSrv.client.findById(req.params.id);
                logger.info("product service findById success", product);
            }
            catch(error) {
                logger.error("product service findById error", error);
                return res.serverError(error);
            }

            if(data.selectedTags) {
                try {
                    let {category,tags} = await Utils.generateCategory(Object.assign({}, product, {selectedTags: data.selectedTags}));
                    logger.info("product utils generateCategory success", {category,tags});

                    data.category = category;
                    data.tags = tags;
                }
                catch(error) {
                    logger.error("product utils generateCategory success", error);
                }
            }

            logger.info("product let's generate hash", {data});
            data.hash = `${data.category||product.category}${data.nameId||product.nameId}`;
        }

        // Prevent empty category
        if(lodash.isEmpty(data.category)) {
            data.category = "~";
        }

        // Try to update user profile.
        try {
            result = await ProductSrv.client.update(
                req.params.id,
                new ProductSrv.types.Data(data),
                logger.trackId
            );

            logger.info("product service update success", result);
        }
        catch(error) {
            logger.error("product service update error", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function updates the price of a product.
     */
    async updatePrice(req, res) {
        let result,
            data = req.body,
            logger = Logger.create("updatePrice", req.trackId);

        logger.info("enter", req.body);

        // Set creator as current user.
        data.creator = req.uid;
        data.target = req.params.id;
        data.type = PriceSrv.types.PriceType.PRODUCT_PRICE;

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
            result = await ProductSrv.client.update(
                req.params.id,
                new ProductSrv.types.Data({
                    priceValue: data.value,
                    currencySymbol: data.currencySymbol,
                    currencyCode: data.currencyCode
                }),
                logger.trackId
            );

            logger.info("product service update success", result);
        }
        catch(error) {
            logger.error("product service update error", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function updates the cost price of a product.
     */
    async updateCost(req, res) {
        let result,
            data = req.body,
            logger = Logger.create("updateCost", req.trackId);

        logger.info("enter", req.body);

        // Set creator as current user.
        data.creator = req.uid;
        data.target = req.params.id;
        data.type = PriceSrv.types.PriceType.PRODUCT_COST;

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

        // Try to update product with new costValue.
        try {
            result = await ProductSrv.client.update(
                req.params.id,
                new ProductSrv.types.Data({
                    costValue: data.value
                }),
                logger.trackId
            );

            logger.info("product service update success", result);
        }
        catch(error) {
            logger.error("product service update error", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function updates the price of a product.
     */
    async updateStatus(req, res) {
        let result,
            data = req.body,
            logger = Logger.create("updateStatus", req.trackId);

        logger.info("enter", req.body);

        // Try to update product with new status.
        try {
            result = await ProductSrv.client.update(
                req.params.id,
                new ProductSrv.types.Data({
                    status: data.status
                }),
                logger.trackId
            );

            logger.info("product service update success", result);
        }
        catch(error) {
            logger.error("product service update error", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function handles tag updated event.
     */
    async handleTagUpdatedEvent(message={}) {
        let products,
            promises = [],
            {tag, updatedKeys} = message,
            logger = Logger.create("handleTagUpdatedEvent", message.trackId);

        logger.info("enter", message);

        if(!lodash.intersection(updatedKeys, ["nameId","categories","priority"]).length) {return;}

        // When nameId or categories has changed we must update
        // category hash in all product in which tag is present.
        try {
            products = await ProductSrv.client.find({
                tags: [tag._id]
            });

            logger.info("product service find success", {count: products.length});
        }
        catch(error) {
            return logger.error("product service find error", error);
        }

        // Iterate over product and update each of them
        for(let product of products) {
            // Regenerate tags, category and hash for the product.
            promises.push(((product) => {
                return Utils.generateCategory(product)
                .then((result) => {
                    result.hash = `${result.category}${product.nameId}`;

                    // Update the product
                    return ProductSrv.client.update(
                        product._id,
                        new ProductSrv.types.Data(result),
                        logger.trackId
                    );
                });
            })(product));
        }

        // Wait for all promises to resolve.
        try {
            let results = await Promise.all(promises);
            logger.debug("product update all success", results);
        }
        catch(error) {
            logger.error("product update all error", error);
        }
    }
};
