let lodash                  = require("lodash"),
    LoggerFactory           = require("common-logger"),
    populate                = require("common-utils/lib/populate"),
    config                  = require("common-config"),
    AuthSrv                 = require("services/auth"),
    UserSrv                 = require("services/user"),
    OrderSrv                = require("services/order"),
    ProductSrv              = require("services/product"),
    ListSubscriptionSrv     = require("services/list_subscription"),
    BillingSrv              = require("services/billing"),
    Notification            = require("utils/notification"),
    Kafka                   = require("utils/kafka"),
    Types                   = require("types");

// Instantiate the logger factory.
let Logger = new LoggerFactory("order.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    constructor() {
        Kafka.on("billing:gateway_notification:order.payment_succeeded", this.handleOrderPaymentSucceededEvent.bind(this));
    }

    /**
     * This function creates a new record.
     */
    async create(req, res) {
        let result,
            billingCustomer,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);

        // Set metadata
        data.user = req.uid;

        // If user is not admin and order is bellow the minimum total value,
        // then return an error.
        /*if(req.user.roles.indexOf("admin") < 0 && data.totalPrice < config.order.minTotalPrice) {
            return res.serverError(new OrderSrv.types.OrderError({
                code: OrderSrv.types.ErrorCode.TOTAL_PRICE_BELLOW_MINIMUM,
                message: "the total price should be above the minimum"
            }));
        }*/

        // If user has no billingCustomer info, then
        // let's create it. 
        // 
        // @NOTE : Moip sucks to require shippingAddress
        // on customer level.
        if(!req.user.billingCustomer) {
            logger.debug("let's create billingCustomer");

            try {
                billingCustomer = await BillingSrv.client.customerCreate(req.user);

                logger.info("billing service customerCreate success", {billingCustomer});
            }
            catch(error) {
                logger.error("billing service customerCreate error", error);
            }
        }
        else {
            billingCustomer = req.user.billingCustomer;
        }

        // Retrieve all products to process items.
        let products = lodash.map(data.items, "product");

        try {
            products = await ProductSrv.client.find({
                _id: products
            }, logger.trackId);

            logger.info("product service find success", {count: products.length});

            // map products
            products = lodash.reduce(products, (map, product) => {
                map[product._id] = product;
                return map;
            }, {});
        }
        catch(error) {
            logger.error("product service find error", error);
            return res.serverError(error);
        }

        // Process items
        let items = [];

        for(let item of data.items) {
            let product = products[item.product];

            if(!product) {
                return res.serverError(new ProductSrv.types.ProductError({
                    code: ProductSrv.types.ErrorCode.NOT_FOUND,
                    message: `product ${item.product} not found`
                }));
            }

            // For products of type "on_stock" we set item status
            // directly to stocked and stockedQuantity to full quantity.
            items.push(lodash.assign({}, item, {
                status: product.type == ProductSrv.types.SupplyType.ON_STOCK ?
                    OrderSrv.types.ItemStatus.STOCKED :
                    OrderSrv.types.ItemStatus.PENDING,
                stockedQuantity: ProductSrv.types.SupplyType.ON_STOCK ?
                    item.quantity : 0
            }));
        }

        // Set new processed items
        data.items = items;

        // Try to create a new order.
        try {
            result = await OrderSrv.client.create(
                new OrderSrv.types.Data(data),
                logger.trackId
            );

            logger.info("order service create success", result);
        }
        catch(error) {
            logger.error("order service create error", error);
            return res.serverError(error);
        }

        // Build billing order data
        let billingOrderData = {
            _id: result._id,
            customer: billingCustomer,
            currency: data.currencyCode,
            items: []
        };
        
        for(let item of data.items) {
            billingOrderData.items.push({
                product: item.product,
                price: item.priceValue,
                currency: item.currencyCode,
                quantity: item.quantity
            });
        }

        // Try to create a billing order.
        try {
            let billingOrder = await BillingSrv.client.orderCreate(billingOrderData, logger.trackId);
            logger.info("billing service orderCreate success", billingOrder);

            result.billingOrder = billingOrder._id;
        }
        catch(error) {
            logger.error("billing service orderCreate error", error);
            return res.serverError(error);
        }

        // Send email to admins. But first, populate it with
        // user data and item product.
        populate([lodash.cloneDeep(result)], ["user", "items[].product"], {
            "user": require("services/user"),
            "items[].product": require("services/product")
        }).then((results) => {
            logger.debug("service populate success", results);

            // Emit notifications
            Notification.emit([{
                channel: "email",
                roles: ["admin"],
                type: "admin:message",
                body: {
                    subject: "new_order",
                    data: results[0]
                }
            }]);
        });

        // Send result
        res.success(result);
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

        // Prevent non admin users to find orders of other users.
        if(req.user.roles.indexOf("admin") < 0) {
            query.user = [req.user._id];
        }

        // Try to find records
        try {
            records = await OrderSrv.client.find(
                new OrderSrv.types.Query(query), 
                logger.trackId
            );
        }
        catch(error) {
            logger.error("order service find error", error);
            return res.serverError(error);
        }

        logger.info("order service find success", {
            count: records.length
        });

        // Populate
        populate(records, lodash.flatten([req.query.populate]), {
            "user": require("services/user"),
            "items[].product": require("services/product"),
            "items[].product.mainProfileImage": require("services/file")
        }).then((records) => {
            logger.debug("service populate success");
            res.success(records);
        });
    }

    /**
     * This function finds a specific order.
     */
    async findById(req, res) {
        let record,
            logger = Logger.create("findById", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find record
        try {
            record = await OrderSrv.client.findById(req.params.id, logger.trackId);
            logger.info("order service findById success", record);
        }
        catch(error) {
            logger.error("order service findById error", error);
            return res.serverError(error);
        }

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "user": require("services/user"),
            "items[].product": require("services/product"),
            "items[].product.mainProfileImage": require("services/file")
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
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // Try to update user profile.
        try {
            result = await OrderSrv.client.update(
                req.params.id,
                new OrderSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("order service update error", error);
            return res.serverError(error);
        }

        logger.info("order service update success", result);
        res.success(true);
    }

    /**
     * This function updates the status of a record.
     */
    async updateStatus(req, res) {
        let order,
            logger = Logger.create("updateStatus", req.trackId);

        logger.info("enter", req.body);

        // Try to update order status.
        try {
            order = await OrderSrv.client.updateStatus(
                req.params.id,
                req.body.status,
                false,
                logger.trackId
            );

            logger.info("order service updateStatus success", order);
        }
        catch(error) {
            logger.error("order service updateStatus error", error);
            return res.serverError(error);
        }

        // Emit notifications
        Notification.emit([{
            channel: "email",
            users: [order.user],
            type: "order:status_updated",
            body: {data: order}
        }, {
            channel: "sms",
            users: [order.user],
            type: "order:status_updated",
            body: {data: order}
        }, {
            channel: "email",
            roles: ["admin"],
            type: "admin:message",
            body: {
                subject: "order_status_updated",
                data: order
            }
        }]);

        res.success(order);
    }

    /**
     * This endpoint going to approve an order.
     */
    async approve(req, res) {
        let order,
            user,
            subscription,
            result,
            logger = Logger.create("approve", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to find the order
        try {
            order = await OrderSrv.client.findById(req.params.id, logger.trackId);
            logger.info("order service findById success", order);
        }
        catch(error) {
            logger.error("order service findById error", error);
            return res.serverError(error);
        }

        if(!order.listSubscription) {
            return res.serverError(new OrderSrv.types.OrderError({
                code: OrderSrv.types.ErrorCode.ONLY_LIST_SUBSCRIPTION_ORDER_ALLOWED,
                message: "only list subscription order allowed"
            }));
        }

        // If order is not in unapproved status, then prevent.
        if(order.status != OrderSrv.types.Status.UNAPPROVED) {
            return res.serverError(new OrderSrv.types.OrderError({
                code: OrderSrv.types.ErrorCode.ONLY_UNAPPROVED_ORDER_ALLOWED,
                message: "only unapproved order allowed"
            }));
        }

        // Prevent process an order without billing info.
        if(!order.billingOrder) {
            return res.serverError(new Types.ApiError({
                code: Types.ErrorCode.MISSING_BILLING_INFO,
                message: "missing billingOrder field"
            }));
        }

        // Try to find the order user
        try {
            user = await UserSrv.client.findById(order.user);
            logger.info("user service findById success", user);
        }
        catch(error) {
            logger.error("user service findById error", error);
            return res.serverError(error);
        }

        // Validate user password.
        try {
            let isPasswordValid = await AuthSrv.client.validatePassword(
                user.email,
                req.body.password
            );

            logger.info("auth service validatePassword success", {isPasswordValid});
        }
        catch(error) {
            logger.error("auth service validatePassword error", error);
            return res.serverError(error);
        }

        // Fetch list subscription
        try {
            subscription = await ListSubscriptionSrv.client.findById(order.listSubscription);
            logger.info("list subscription service findById success", subscription);
        }
        catch(error) {
            logger.error("list subscription service findById error", error);
            return res.serverError(error);
        }

        // If subscription does not contain a billingSource, then prevent
        // to go any further.
        if(!subscription.billingSource) {
            return res.serverError(new ListSubscriptionSrv.types.ListSubscriptionError({
                code: ListSubscriptionSrv.types.ErrorCode.NO_BILLING_SOURCE,
                message: "no billing source"
            }));
        }

        // Update order status to payment_pending
        try {
            order = await OrderSrv.client.updateStatus(
                req.params.id,
                OrderSrv.types.Status.PAYMENT_PENDING,
                false,
                logger.trackId
            );

            logger.info("order service updateStatus success", order);
        }
        catch(error) {
            logger.error("order service updateStatus error", error);
            return res.serverError(error);
        }

        // Try to charge the order using subscription billingSource.
        try {
            result = await BillingSrv.client.chargeCreate({
                customer: user.billingCustomer,
                source: {
                    method: lodash.get(subscription, "billingSource.method"),
                    _id: lodash.get(subscription, "billingSource._id")
                },
                order: order.billingOrder
            });

            logger.info("billing service chargeCreate success", result);
        }
        catch(error) {
            logger.error("billing service chargeCreate success", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function updates an order item status.
     */
    async updateItemStatus(req, res) {
        let order,
            logger = Logger.create("updateItemStatus", req.trackId);

        logger.info("enter", req.body);

        let {status} = req.body;

        // Try to update order item status.
        try {
            order = await OrderSrv.client.updateItemStatus(
                req.params.id,
                req.params.product,
                status,
                logger.trackId
            );

            logger.info("order service updateItemStatus success", order);
        }
        catch(error) {
            logger.error("order service updateItemStatus error", error);
            return res.serverError(error);
        }

        res.success(true);
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
            result = await OrderSrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("order service remove error", error);
            return res.serverError(error);
        }

        logger.info("order service remove success", result);
        res.success(true);
    }

    /**
     * This function charges an order.
     */
    async charge(req, res) {
        let result,
            order,
            logger = Logger.create("charge", req.trackId);

        // Try to find the order by it's id.
        try {
            order = await OrderSrv.client.findById(req.params.id);
            logger.info("order service findById success", order);
        }
        catch(error) {
            logger.error("order service findById error", error);
            return res.serverError(error);
        }

        // Check if there is a billingOrder associated.
        // 
        // @TODO : Try to charge some times case billingOrder was
        // not created yet.
        if(!order.billingOrder) {
            return res.serverError(new Types.ApiError({
                code: Types.ErrorCode.MISSING_BILLING_INFO,
                message: "missing billingOrder field"
            }));
        }

        // Try to charge the order.
        try {
            result = await BillingSrv.client.chargeCreate({
                customer: req.user.billingCustomer,
                source: req.body.source,
                order: order.billingOrder
            });

            logger.info("billing service chargeCreate success", result);
        }
        catch(error) {
            logger.error("billing service chargeCreate success", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function finds a charge assotiated to a specific order.
     */
    async chargeFind(req, res) {
        let result,
            order,
            logger = Logger.create("chargeFind", req.trackId);

        // Try to find the order by it's id.
        try {
            order = await OrderSrv.client.findById(req.params.id);
            logger.info("order service findById success", order);
        }
        catch(error) {
            logger.error("order service findById error", error);
            return res.serverError(error);
        }

        if(!order.billingCharge) {
            return res.serverError(new Types.ApiError({
                code: Types.ErrorCode.MISSING_BILLING_INFO,
                message: "missing billingCharge field"
            }));
        }

        // Try to find charge.
        try {
            result = await BillingSrv.client.chargeFindById(order.billingCharge);
            logger.info("billing service chargeFindById success", result);
        }
        catch(error) {
            logger.error("billing service chargeFindById success", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function handles billing gateway notification.
     */
    async handleOrderPaymentSucceededEvent(data={}) {
        let {notification} = data,
            logger = Logger.create("handleOrderPaymentSucceededEvent", data.trackId);

        logger.info("enter", data);

        // Extract relevant data from notification.
        let {order} = notification.data;
        logger.info("order", {order});

        // We must:
        // (1) update the order status.
        // (2) email user with order info.
        // (3) email admins with order info.
        // Find order.
        
        // Try to find the order by billingOrder
        try {
            order = await OrderSrv.client.findByBillingOrderId(order);
            logger.info("order service findByBillingOrderId success", order);
        }
        catch(error) {
            return logger.error("order service update error", error);
        }

        // Let's update order status
        try {
            order = await OrderSrv.client.updateStatus(
                order._id, 
                OrderSrv.types.Status.PAYMENT_AUTHORIZED,
                false,
                logger.trackId
            );

            logger.info("order service update success", order);
        }
        catch(error) {
            return logger.error("order service update error", error);
        }

        // Populate order with data
        let results = await populate([lodash.cloneDeep(order)], ["items[].product","items[].product.mainProfileImage"], {
            "items[].product": require("services/product"),
            "items[].product.mainProfileImage": require("services/file")
        });

        // Set order as first result.
        let populatedOrder = results[0];
        logger.debug("populate completed", order);

        // Propagate event through the system
        Kafka.emit("order:payment_succeeded", order);

        // Emit notifications
        Notification.emit([{
            channel: "email",
            users: [order.user],
            type: "order:payment_authorized",
            body: {data: populatedOrder}
        }, {
            channel: "sms",
            users: [order.user],
            type: "order:payment_authorized",
            body: {data: populatedOrder}
        }, {
            channel: "email",
            roles: ["admin"],
            type: "admin:message",
            body: {
                subject: "order_payment_authorized",
                data: populatedOrder
            }
        }]);
    }
};
