let lodash          = require("lodash"),
    moment          = require("moment"),
    BrandSrv        = require("services/brand"),
    CompanySrv      = require("services/company"),
    UserSrv         = require("services/user"),
    WalletSrv       = require("services/wallet"),
    TransferSrv     = require("services/transfer"),
    OrderSrv        = require("services/order"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate"),
    config          = require("common-config"),
    CSV             = require("utils/csv"),
    Kafka           = require("utils/kafka"),
    Socket          = require("utils/socket"),
    Notification    = require("utils/notification");

// Instantiate the logger factory.
let Logger = new LoggerFactory("brand.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {

    constructor() {
        Kafka.on("order_item:updated", this.handleOrderItemUpdatedEvent.bind(this));
    }

    /**
     * This function creates a new record.
     */
    async create(req, res) {
        let result,
            promises = [],
            creator = req.user,
            isAdmin = req.user.roles.indexOf("admin") >= 0,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);

        // Process data creator
        data.creator = req.user._id;

        // If data has status and status is other than
        // not approved, then check wether user is admin.
        if(data.status 
        && data.status != BrandSrv.types.STATUS_NOT_APPROVED
        && !isAdmin) {
            return res.serverError(new BrandSrv.types.BrandError({
                code: BrandSrv.types.ErrorCode.UNAUTHORIZED_STATUS,
                message: "You do not have permission to set status to not approved"
            }));
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
        let owners = [];
        let mainOwner = {
            user: req.user._id,
            status: BrandSrv.types.OWNER_STATUS_APPROVED,
            role: BrandSrv.types.OWNER_ROLE_ADMIN
        };

        // Add user as main owner.
        if(!isAdmin) { owners.push(mainOwner); }

        for(let owner of data.owners||[]) {
            if(owner.user == req.user._id){
                if(isAdmin) { owners.push(mainOwner); }
                continue;
            }

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

        // Try to create a wallet to the new brand.
        try {
            let result = await WalletSrv.client.create(
                new WalletSrv.types.Data({
                    users: lodash.map(lodash.filter(owners, (owner) => {
                        return owner.status == BrandSrv.types.OWNER_STATUS_APPROVED;
                    }), "user")
                }),
                logger.trackId
            );

            logger.info("wallet service create success", result);
            data.wallet = result._id;
        }
        catch(error) {
            logger.error("wallet service create error", error);
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

            Notification.emit([{
                channel: "email",
                roles: ["admin"],
                type: "admin:message",
                body: {
                    subject: "new_brand",
                    data: results[0]
                }
            }]);
        });

        // Return 
        res.success(result);
    }

    /**
     * This function create multiple brands from a csv string.
     */
    async createFromCsv(req, res) {
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
    async find(req, res) {
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
            "wallet": require("services/wallet"),
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
    async count(req, res) {
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
    async findById(req, res) {
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
            "wallet": require("services/wallet"),
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
    async findByNameId(req, res) {
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
            "wallet": require("services/wallet"),
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
     * This function find brand orders.
     */
    async findOrders(req, res) {
        let records,
            brand,
            user = req.user,
            brandId = req.params.id,
            itemStatus = req.query.itemStatus?lodash.flatten([req.query.itemStatus]):null,
            logger = Logger.create("findOrders", req.trackId);

        // delete item status.
        delete req.query.itemStatus;

        logger.info("enter", {brandId, query: req.query});

        // Try to find brand (to validate user)
        try {
            brand = await BrandSrv.client.findById(req.params.id, logger.trackId);
            logger.info("brand service findById success", brand);
        }
        catch(error) {
            logger.error("brand service findById error", error);
            return res.serverError(error);
        }

        // @TODO : Check if requesting user is an approved owner of the
        // brand.
        let owner = lodash.find(brand.owners, (owner) => {
            return owner.user == user._id;
        });

        if(user.roles.indexOf("admin") < 0 && (!owner || owner.status != BrandSrv.types.OWNER_STATUS_APPROVED)) {
            return res.serverError(new BrandSrv.types.BrandError({
                code: BrandSrv.types.ErrorCode.ONLY_APPROVED_OWNERS_ALLOWED,
                message: "Only approved owners are allowed to perform this request."
            }));
        }

        // Try to find records
        try {
            records = await OrderSrv.client.find(lodash.assign({}, req.query, {
                brands: [brandId]
            }), logger.trackId);

            logger.info("brand service find success", {
                count: records.length
            });
        }
        catch(error) {
            logger.error("order service find error", error);
            return res.serverError(error);
        }

        // Populate
        populate(records, ["items[].product", "items[].product.mainProfileImage"], {
            "items[].product": require("services/product"),
            "items[].product.mainProfileImage": require("services/file")
        }).then((records) => {
            //logger.info("@@@@@@@@@@@ populate records", records);

            // Build minimum info
            let result = {};

            for(let order of records) {
                //logger.info("@@@@@@@@@@@ order", order);

                // @TODO : Worst schema ever!!
                let pickupDate = moment(order.deliverDate).subtract(1, "day").toISOString();

                //logger.info("@@@@@@@@@@@ order pickupDate", {pickupDate});

                for(let item of order.items) {
                    if(item.product.brand != brandId){continue;}
                    if(itemStatus && itemStatus.indexOf(item.status) < 0) {continue;}

                    result[item.status] = result[item.status]||{};
                    result[item.status][pickupDate] = result[item.status][pickupDate] || {};
                    let itemResult = result[item.status][pickupDate][item.product._id] = result[item.status][pickupDate][item.product._id] || {
                        quantity: 0,
                        totalPrice: 0,
                        totalFee: 0,
                        product: item.product,
                        priceToQuantityMap: {},
                        orders: [],
                        status: item.status,
                        pickupDate
                    };

                    let grossPrice = (item.quantity * item.priceValue);
                    let fee = 0;

                    if(item.product.supplyType == "on_demand") {
                        fee = Math.floor(grossPrice * config.fee.onDemand / 100);
                    }

                    itemResult.quantity += item.quantity;
                    itemResult.totalFee += fee;
                    itemResult.totalPrice += (grossPrice - fee);
                    itemResult.priceToQuantityMap[item.priceValue] = itemResult.priceToQuantityMap[itemResult.totalPrice] || 0;
                    itemResult.priceToQuantityMap[item.priceValue] += item.quantity;
                    itemResult.orders.push(order._id);
                }
            }

            console.log("result", result);

            // Sort results
            let results = [];

            for(let status of Object.keys(result)) {
                for(let date of Object.keys(result[status])) {
                    results = results.concat(Object.values(result[status][date]));
                }
            }

            results = lodash.orderBy(results, [(result) => {
                return ["pending","ready","stocked"].indexOf(result.status);
            }, (result) => {
                return result.pickupDate;
            }], ["asc", "desc"]);

            logger.debug("service populate success", results);
            res.success(results);
        });
    }

    /**
     * This function find transfers assotiated to a brand.
     */
    async findTransfers(req, res) {
        let brand,
            transfers,
            user = req.user,
            logger = Logger.create("findTransfers", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find brand (to get it's wallet)
        try {
            brand = await BrandSrv.client.findById(req.params.id, logger.trackId);
            logger.info("brand service findById success", brand);
        }
        catch(error) {
            logger.error("brand service findById error", error);
            return res.serverError(error);
        }

        // @TODO : Check if requesting user is an approved owner of the
        // brand.
        let owner = lodash.find(brand.owners, (owner) => {
            return owner.user == user._id;
        });

        if(user.roles.indexOf("admin") < 0 && (!owner || owner.status != BrandSrv.types.OwnerStatus.APPROVED)) {
            return res.serverError(new BrandSrv.types.BrandError({
                code: BrandSrv.types.ErrorCode.ONLY_APPROVED_OWNERS_ALLOWED,
                message: "Only approved owners are allowed to perform this request."
            }));
        }

        // Find all transfers on brand wallet.
        try {
            transfers = await TransferSrv.client.find(lodash.assign({}, req.query, {
                wallet: [brand.wallet]
            }));

            logger.info("transfer service find success", {count: transfers.count});
        }
        catch(error) {
            logger.error("transfer service find error", error);
            return res.serverError(error);
        }

        // Populate
        /*populate([record], lodash.flatten([req.query.populate]), {
            "wallet": require("services/wallet"),
            "owners": require("services/user"),
            "profileImages": require("services/file"),
            "images": require("services/file"),
            "company": require("services/company")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records[0]);
        });*/

        res.success(transfers);
    }
    
    /**
     * This function find the brand wallet.
     */
    async findWallet(req, res) {
        let brand,
            wallet,
            user = req.user,
            logger = Logger.create("findWallet", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find brand (to get it's wallet)
        try {
            brand = await BrandSrv.client.findById(req.params.id, logger.trackId);
            logger.info("brand service findById success", brand);
        }
        catch(error) {
            logger.error("brand service findById error", error);
            return res.serverError(error);
        }

        // @TODO : Check if requesting user is an approved owner of the
        // brand.
        let owner = lodash.find(brand.owners, (owner) => {
            return owner.user == user._id;
        });

        if(user.roles.indexOf("admin") < 0 && (!owner || owner.status != BrandSrv.types.OwnerStatus.APPROVED)) {
            return res.serverError(new BrandSrv.types.BrandError({
                code: BrandSrv.types.ErrorCode.ONLY_APPROVED_OWNERS_ALLOWED,
                message: "Only approved owners are allowed to perform this request."
            }));
        }

        // Find wallet by id.
        try {
            wallet = await WalletSrv.client.findById(brand.wallet);
            logger.info("transfer service find success", wallet);
        }
        catch(error) {
            logger.error("transfer service find error", error);
            return res.serverError(error);
        }

        // Populate
        /*populate([record], lodash.flatten([req.query.populate]), {
            "wallet": require("services/wallet"),
            "owners": require("services/user"),
            "profileImages": require("services/file"),
            "images": require("services/file"),
            "company": require("services/company")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records[0]);
        });*/

        res.success(wallet);
    }

    /**
     * This function updates a record.
     */
    async update(req, res) {
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
    async remove(req, res) {
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

    /**
     * This function handles order item status updated.
     */
    async handleOrderItemUpdatedEvent(message={}) {
        let transfer,
            logger = Logger.create("handleOrderItemUpdatedEvent", message.trackId);

        logger.info("enter", message);

        let {orderItem,updatedKeys} = message;

        // Handle only status update.
        if(updatedKeys.indexOf("status") < 0){return;}

        // Lets populate item with product and brand
        try {
            let results = await populate([orderItem], ["product", "product.brand"], {
                "product": require("services/product"),
                "product.brand": require("services/brand")
            });

            logger.info("service populate success", results);

            orderItem = results[0];
        }
        catch(error) {
            return logger.error("service populate error", error);
        }
        
        // We only process status change from "ready" to "stocked"
        // on products with supplyType of "on_demand".
        if(orderItem.product.supplyType != "on_demand" || orderItem.status != "stocked") {return;}

        // Try to create the transfer
        try {
            transfer = await TransferSrv.client.create(
                new TransferSrv.types.Data({
                    wallet: lodash.get(orderItem,"product.brand.wallet"),
                    grossValue: orderItem.grossTotalPrice,
                    value: orderItem.totalSellerPrice,
                    fees: orderItem.sellerFees
                }),
                logger.trackId
            );

            logger.info("transfer service create success", transfer);
        }
        catch(error) {
            return logger.error("service populate error", error);
        }

        // Now, notify all brand approved owners.
        let approvedOwners = [];

        for(let owner of lodash.get(orderItem, "product.brand.owners")||[]) {
            if(owner.status == "approved") {
                approvedOwners.push(owner.user);
            }
        }

        Socket.shared.emitToUsers([approvedOwners], "brand:transfer:created", {
            result: transfer
        }, {
            includeRoles: ["admin"]
        });
    }
};
