let Mongo           = require("common-utils/lib/mongo"),
    LoggerFactory   = require("common-logger"),
    config          = require("common-config"),
    hash            = require("utils/hash"),
    lodash          = require("lodash"),
    moment          = require("moment"),
    CreateHandler   = require("./create"),
    UpdateHandler   = require("./update"),
    FindHandler     = require("./find");
    //RemoveHandler   = require("./remove"),
    //CheckHandler    = require("./check");

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
            rootUser = await collection.insertOne(rootUser);
            logger.info("collection insertOne rootUser success", rootUser);
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
        let collection = db.collection("users");

        this.createHandler = new CreateHandler({collection, mode});
        this.updateHandler = new UpdateHandler({collection, mode});
        this.findHandler = new FindHandler({collection, mode});
        //this.removeHandler = new RemoveHandler({collection, mode});
        //this.checkHandler = new CheckHandler({collection, mode});
    }

    /**
     * This function creates a new user.
     */
    async create(
        data,
        trackId
    ) {
        console.log("create", data);

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
        await this.updateHandler.update(
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
     * This function check if nickName is available.
     */
    /*async isEmailAvailable(
        email,
        trackId
    ) {
        let data = await this.checkHandler.checkIsEmailAvailable(
            email,
            trackId
        );

        return data;
    }*/

    /**
     * This function add an address to user profile.
     */
    async addAddress(
        id,
        address,
        trackId
    ) {
        return await this.updateHandler.addAddress(
            id,
            address,
            trackId
        );
    }

    /**
     * This function removes an address from user profile.
     */
    async removeAddress(
        id,
        addressId,
        trackId
    ) {
        return await this.updateHandler.removeAddress(
            id,
            addressId,
            trackId
        );
    }
};