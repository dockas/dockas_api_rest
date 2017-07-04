let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    config          = require("common-config"),
    hash            = require("utils/hash"),
    lodash          = require("lodash"),
    moment          = require("moment"),
    Kafka           = require("utils/kafka"),
    Socket          = require("utils/socket"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find"),
    //RemoveHandler   = require("./remove"),
    CheckHandler    = require("./check");

let Logger = new LoggerFactory("user");

module.exports = class UserSrv {
    /**
     * This static function setups room db collection.
     */
    static async setupCollection(db) {
        // Local variables
        let collection,
            rootUser,
            logger = Logger.create("setupCollection");

        logger.info("enter");

        // Try to create the collection
        try {
            collection = await db.createCollection("users");

            logger.info("collection create success");
        }
        catch(error) {
            logger.error("collection create error", error);
        }

        // Try to create index on email
        try {
            await collection.createIndex("email", {
                unique: true,
                background: true,
                w:1,
                partialFilterExpression: { deletedAt: {$type: "null"} }
            });

            logger.info("collection createIndex on email success");
        }
        catch(error) {
            logger.error("collection createIndex on email error", error);
        }

        // Try to create index on billingCustomer
        try {
            await collection.createIndex("billingCustomer", {
                background: true,
                w:1
            });

            logger.info("collection createIndex on billingCustomer success");
        }
        catch(error) {
            logger.error("collection createIndex on billingCustomer error", error);
        }

        // Try to hash the password
        try {
            rootUser = lodash.cloneDeep(config.rootUser);
            rootUser.addresses = [];
            rootUser.createdAt = moment().toISOString();

            rootUser.password = await hash(rootUser.password);
        }
        catch(error) {
            logger.error("hash rootUser password error", error);
        }

        // Try to create root user
        try {
            let result = await collection.insertOne(rootUser);
            logger.info("collection insertOne rootUser success", rootUser);

            // Emit event
            Kafka.emit("user:created", Object.assign({}, rootUser, {
                _id: result.insertedId
            }));
        }
        catch(error) {
            logger.error("collection insertOne rootUser error", error);
        }
    }

    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";
        let db = opts.db || Mongo.db;
        let collection = this.collection = db.collection("users");

        this.createHandler = new CreateHandler({collection, mode});
        this.updateHandler = new UpdateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        //this.removeHandler = new RemoveHandler({collection, mode});
        this.checkHandler = new CheckHandler({collection, mode});

        // Listen to kafka events
        Kafka.on("billing:customer:created", this.handleBillingCustomerCreatedEvent.bind(this));
        Kafka.on("billing:source:created", this.handleBillingSourceCreatedEvent.bind(this));
        Kafka.on("brand:created", this.handleBrandCreatedEvent.bind(this));
        Kafka.on("list:created", this.handleListCreatedEvent.bind(this));
        Kafka.on("list_subscription:created", this.handleListSubscriptionCreatedEvent.bind(this));
    }

    /**
     * This function creates a new user.
     */
    async create(
        data,
        trackId
    ) {
        return await this.createHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function updates a user by it's id.
     */
    async update(
        id,
        data,
        trackId
    ) {
        return await this.updateHandler.update(
            id,
            data,
            trackId
        );
    }

    /**
     * This function removes a user by it's id.
     */
    /*async remove(
        id,
        trackId
    ) {
        await this.removeHandler.remove(
            id,
            trackId
        );
    }*/

    /**
     * This function find users that match some query.
     */
    async find(
        query,
        trackId
    ) {
        return await this.findHandler.find(
            query,
            trackId
        );
    }

    /**
     * This function finds an user by it's id.
     */
    async findById(
        id,
        trackId
    ) {
        return await this.findHandler.findById(
            id,
            trackId
        );
    }

    /**
     * This function finds an user by it's email.
     */
    async findByEmail(
        email,
        trackId
    ) {
        return await this.findHandler.findByEmail(
            email,
            trackId
        );
    }

    /**
     * This function check if nickName is available.
     */
    async isEmailAvailable(
        email,
        trackId
    ) {
        return await this.checkHandler.isEmailAvailable(
            email,
            trackId
        );
    }

    /**
     * This function add items to arrays.
     */
    async addItems(
        id,
        data,
        trackId
    ) {
        return await this.updateHandler.addItems(
            id,
            data,
            trackId
        );
    }

    /**
     * This function remove items from arrays.
     */
    async removeItems(
        id,
        data,
        trackId
    ) {
        return await this.updateHandler.removeItems(
            id,
            data,
            trackId
        );
    }

    /**
     * This function handles billing customer created event.
     */
    async handleBillingCustomerCreatedEvent(data={}) {
        let logger = Logger.create("handleBillingCustomerCreatedEvent", data.trackId);
        logger.info("enter", data);

        let {billingCustomer} = data;

        // Update user with billingCustomerId
        try {
            let result = await this.updateHandler.update(
                billingCustomer.user,
                {billingCustomer: billingCustomer._id},
                logger.trackId
            );

            logger.info("user update success", result);
        }
        catch(error) {
            logger.error("user update error", error);
        }
    }

    /**
     * This function handles billing source created event.
     */
    async handleBillingSourceCreatedEvent(data={}) {
        let result,
            {billingSource} = data,
            logger = Logger.create("handleBillingSourceCreatedEvent", data.trackId);

        logger.info("enter", billingSource);

        // Parse to mongo query data
        let $addToSet = {billingSources: lodash.pick(billingSource, [
            "method","_id","lastDigits","brand","hash"
        ])};

        // Update user
        try {
            result = await this.collection.findOneAndUpdate({
                billingCustomer: billingSource.customer,
                deletedAt: {$type: "null"}
            }, {$addToSet}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result.value);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);
        }

        // Notify user about this update.
        Socket.shared.emitToUser(result.value._id, "user:updated", {
            result: result.value,
            updatedKeys: ["billingSources"]
        });
    }

    /**
     * This function handles billing source removed event.
     */
    async handleBillingSourceRemovedEvent(data={}) {
        let result,
            {billingSource} = data,
            logger = Logger.create("handleBillingSourceRemovedEvent", data.trackId);

        logger.info("enter", billingSource);

        // Parse to mongo query data
        let $pull = {billingSources: {_id: billingSource._id}};

        // Update user
        try {
            result = await this.collection.findOneAndUpdate({
                billingCustomer: billingSource.customer,
                deletedAt: {$type: "null"}
            }, {$pull}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result.value);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);
        }

        // Notify user about this update.
        Socket.shared.emitToUser(result.value._id, "user:updated", {
            result: result.value,
            updatedKeys: ["billingSources"]
        });
    }

    /**
     * This function handles the creation of a brand. In this
     * case we must update the brandCount of each owner of the
     * brand.
     */
    async handleBrandCreatedEvent(data={}) {
        let results,
            promises = [],
            {brand} = data,
            logger = Logger.create("handleBrandCreatedEvent", data.trackId);

        logger.info("enter", brand);

        // For each approved owner we gonna update
        // it brand count.
        let approvedOwners = brand.owners.map((o) => {
            if(o.status == "approved") {return o.user;}
        });

        for(let owner of approvedOwners) {
            promises.push(
                this.collection.findOneAndUpdate({
                    _id: Mongo.toObjectID(owner),
                    deletedAt: {$type: "null"}
                }, {$inc: {brandCount: 1}}, {returnOriginal: false})
            );
        }

        // Update user
        try {
            results = await Promise.all(promises);
            logger.info("collection findOneAndUpdate success", results);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);
        }

        // Notify each approved owner
        for(let result of results) {
            // Notify approved owners
            Socket.shared.emitToUser(result.value._id, "user:updated", {
                result: result.value,
                updatedKeys: ["brandCount"]
            });
        }
    }

    async handleListCreatedEvent(message={}) {
        let results,
            promises = [],
            {list} = message,
            logger = Logger.create("handleListCreatedEvent", message.trackId);

        logger.info("enter", message);

        for(let owner of list.owners) {
            promises.push(
                this.collection.findOneAndUpdate({
                    _id: Mongo.toObjectID(owner.user),
                    deletedAt: {$type: "null"}
                }, {$addToSet: {lists: list._id}}, {returnOriginal: false})
            );
        }

        // Update user
        try {
            results = await Promise.all(promises);
            logger.info("collection findOneAndUpdate success", results);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);
        }

        // Notify users
        for(let result of results) {
            Socket.shared.emitToUser(result._id, "user:updated", {
                result: result,
                updatedKeys: ["lists"]
            });
        }
    }

    async handleListSubscriptionCreatedEvent(message={}) {
        let result,
            {subscription} = message,
            logger = Logger.create("handleListSubscriptionCreatedEvent", message.trackId);

        logger.info("enter", message);

        // Update user
        try {
            result = await this.collection.findOneAndUpdate({
                _id: Mongo.toObjectID(subscription.user),
                deletedAt: {$type: "null"}
            }, {$addToSet: {listSubscriptions: subscription._id}}, {returnOriginal: false});

            logger.info("collection findOneAndUpdate success", result);
        }
        catch(error) {
            logger.error("collection findOneAndUpdate error", error);
        }

        // Notify users
        Socket.shared.emitToUser(result._id, "user:updated", {
            result: result,
            updatedKeys: ["listSubscriptions"]
        });
    }
};
