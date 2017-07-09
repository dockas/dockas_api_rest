let lodash                  = require("lodash"),
    //moment                  = require("moment"),
    LoggerFactory           = require("common-logger"),
    populate                = require("common-utils/lib/populate"),    
    //config                  = require("common-config"),
    OrderItemSrv            = require("services/order_item"),
    BrandSrv                = require("services/brand"),
    CompanySrv              = require("services/company"),
    Notification            = require("utils/notification"),
    Socket                  = require("utils/socket");
    //Types                   = require("types");

// Instantiate the logger factory.
let Logger = new LoggerFactory("order_item.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    constructor() {
        //Kafka.on("billing:gateway_notification:order.payment_succeeded", this.handleOrderPaymentSucceededEvent.bind(this));
    }

    /**
     * This function find generic records in the system.
     *
     * @TODO : non admin user can search only within it's
     * own orders.
     */
    async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = req.query;

        logger.info("enter", {query});

        // Try to find records
        try {
            records = await OrderItemSrv.client.find(
                new OrderItemSrv.types.Query(query), 
                logger.trackId
            );
        }
        catch(error) {
            logger.error("order item service find error", error);
            return res.serverError(error);
        }

        logger.info("order item service find success", {
            count: records.length
        });

        // Populate
        populate(records, lodash.flatten([req.query.populate]), {
            "order": require("services/order"),
            "product": require("services/product"),
            "product.mainProfileImage": require("services/file")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records);
        });
    }

    /**
     * This function finds a specific order item.
     */
    async findById(req, res) {
        let record,
            logger = Logger.create("findById", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find record
        try {
            record = await OrderItemSrv.client.findById(req.params.id, logger.trackId);
            logger.info("order item service findById success", record);
        }
        catch(error) {
            logger.error("order item service findById error", error);
            return res.serverError(error);
        }

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "order": require("services/order"),
            "product": require("services/product"),
            "product.mainProfileImage": require("services/file")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records[0]);
        });
    }

    /**
     * This function updates a record.
     */
    async update(req, res) {
        let item,
            brand,
            company,
            owner,
            approvedOwners = {},
            user = req.user,
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // Find order item we are trying to update.
        try {
            item = await OrderItemSrv.client.findById(
                req.params.id,
                logger.trackId
            );

            logger.info("order item service findById success", item);
        }
        catch(error) {
            logger.error("order item service findById error", error);
            return res.serverError(error);
        }

        // Retrieve item brand
        try {
            brand = await BrandSrv.client.findById(
                item.brand,
                logger.trackId
            );

            logger.info("brand service findById success", brand);
        }
        catch(error) {
            logger.error("brand service findById error", error);
            return res.serverError(error);
        }

        // Push owners
        for(owner of brand.owners) {
            if(owner.status == BrandSrv.types.OwnerStatus.APPROVED) {
                approvedOwners[owner.user] = true;
            }
        }

        // If item has company, retrieve it too.
        if(item.company) {
            try {
                company = await CompanySrv.client.findById(
                    item.company,
                    logger.trackId
                );

                logger.info("company service findById success", company);
            }
            catch(error) {
                logger.error("brand service findById error", error);
            }

            for(owner of company.owners) {
                if(owner.status == CompanySrv.types.OwnerStatus.APPROVED) {
                    approvedOwners[owner.user] = true;
                }
            }
        }

        // Only admins or product owners can update the item.
        if(user.roles.indexOf("admin") < 0 && !approvedOwners[user._id]) {
            return res.serverError(new OrderItemSrv.types.Error({
                code: OrderItemSrv.types.ErrorCode.ONLY_ADMINS_OR_APPROVED_OWNERS_ALLOWED,
                message: "You must be an admin or product owner to perform this request."
            }));
        }

        // Try to update item.
        try {
            item = await OrderItemSrv.client.update(
                req.params.id,
                new OrderItemSrv.types.Data(req.body),
                logger.trackId
            );

            logger.info("order item service update success", item);
        }
        catch(error) {
            logger.error("order item service update error", error);
            return res.serverError(error);
        }

        // Notify
        populate([lodash.cloneDeep(item)], ["order","product"], {
            "order": require("services/order"),
            "product": require("services/product")
        }).then((records) => {
            logger.debug("service populate success");

            // Emit notifications
            Notification.emit([{
                channel: "email",
                roles: ["admin"],
                type: "admin:message",
                body: {
                    subject: "order_item_status_updated",
                    data: records[0]
                }
            }]);
        });

        // Notify connected admins and product approved owners.
        Socket.shared.emitToUsers(
            lodash.keys(approvedOwners),
            "order_item:updated", 
            {
                result: item,
                updatedKeys: Object.keys(req.body)
            },
            {includeRoles: ["admin"]}
        );

        res.success(item);
    }

    /**
     * This function updates the status of a record.
     */
    async updateStatus(req, res) {
        let item,
            brand,
            company,
            owner,
            approvedOwners = {},
            user = req.user,
            logger = Logger.create("updateStatus", req.trackId);

        logger.info("enter", req.body);

        // Find order item we are trying to update.
        try {
            item = await OrderItemSrv.client.findById(
                req.params.id,
                logger.trackId
            );

            logger.info("order item service findById success", item);
        }
        catch(error) {
            logger.error("order item service findById error", error);
            return res.serverError(error);
        }

        // Retrieve item brand
        try {
            brand = await BrandSrv.client.findById(
                item.brand,
                logger.trackId
            );

            logger.info("brand service findById success", brand);
        }
        catch(error) {
            logger.error("brand service findById error", error);
            return res.serverError(error);
        }

        // Push owners
        for(owner of brand.owners) {
            if(owner.status == BrandSrv.types.OwnerStatus.APPROVED) {
                approvedOwners[owner.user] = true;
            }
        }

        // If item has company, retrieve it too.
        if(item.company) {
            try {
                company = await CompanySrv.client.findById(
                    item.company,
                    logger.trackId
                );

                logger.info("company service findById success", company);
            }
            catch(error) {
                logger.error("brand service findById error", error);
            }

            for(owner of company.owners) {
                if(owner.status == CompanySrv.types.OwnerStatus.APPROVED) {
                    approvedOwners[owner.user] = true;
                }
            }
        }

        // Only admins or product owners can update the item.
        if(user.roles.indexOf("admin") < 0 && !approvedOwners[user._id]) {
            return res.serverError(new OrderItemSrv.types.Error({
                code: OrderItemSrv.types.ErrorCode.ONLY_ADMINS_OR_APPROVED_OWNERS_ALLOWED,
                message: "You must be an admin or product owner to perform this request."
            }));
        }

        // Try to update order status.
        try {
            item = await OrderItemSrv.client.update(
                req.params.id,
                new OrderItemSrv.types.Data({status: req.body.status}),
                logger.trackId
            );

            logger.info("order item service update success", item);
        }
        catch(error) {
            logger.error("order service updateStatus error", error);
            return res.serverError(error);
        }

        // Populate
        populate([lodash.cloneDeep(item)], ["order","product"], {
            "order": require("services/order"),
            "product": require("services/product")
        }).then((records) => {
            logger.debug("service populate success");

            // Emit notifications
            Notification.emit([{
                channel: "email",
                roles: ["admin"],
                type: "admin:message",
                body: {
                    subject: "order_item_status_updated",
                    data: records[0]
                }
            }]);

            // Notify connected admins and product approved owners.
            Socket.shared.emitToUsers(
                lodash.keys(approvedOwners),
                "order_item:updated", 
                {
                    result: item,
                    updatedKeys: ["status"]
                },
                {includeRoles: ["admin"]}
            );
        });

        res.success(item);
    }
};
