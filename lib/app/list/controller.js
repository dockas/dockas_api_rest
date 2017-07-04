let lodash          = require("lodash"),
    ListSrv         = require("services/list"),
    UserSrv         = require("services/user"),
    LoggerFactory   = require("common-logger"),
    populate        = require("common-utils/lib/populate"),
    Types           = require("types");

// Instantiate the logger factory.
let Logger = new LoggerFactory("list.ctrl");

/**
 * Controller class definition.
 */
module.exports = class Ctrl {
    /**
     * Constructor
     */
    constructor() {        
    }

    /**
     * This function creates a new record.
     */
    async create(req, res) {
        let result,
            data = req.body,
            logger = Logger.create("create", req.trackId);

        logger.info("enter", data);

        // Process data creator
        data.creator = req.user._id;

        // Let's rebuild the owners to include creator as the
        // main one and let's evaluate owner status.
        let owners = [{
            user: data.creator
        }];

        for(let owner of data.owners||[]) {
            if(owner.user == data.creator){continue;}
            owners.push(owner);
        }

        data.owners = owners;

        // Try to create a new entity.
        try {
            result = await ListSrv.client.create(
                new ListSrv.types.Data(data),
                logger.trackId
            );

            logger.info("list service create success", result);
        }
        catch(error) {
            logger.error("list service create error", error);
            return res.serverError(error);
        }

        // Try to add list to user profiles
        /*try {
            let promises = [];

            for(let uid of data.users) {
                promises.push(UserSrv.client.addItems(uid, {
                    lists: [result]
                }));
            }

            let profiles = await Promise.all(promises);

            logger.info("user service addItems success", profiles);
        }
        catch(error) {
            logger.info("user service addItems error", error);

            // @TODO : Maybe we should remove the created list here
            // to make the operation atomic.
        }*/

        res.success(result);
    }

    /**
     * This function find generic records in the system.
     */
    async find(req, res) {
        let records,
            query = req.query,
            logger = Logger.create("find", req.trackId);

        // Prevent to find private lists of another users.
        if(req.uid && (!query.status || query.status.indexOf("private") >= 0)) {
            query.owners = [req.uid];
        }

        // If user is not authenticated, then search only through
        // public lists.
        if(!req.uid) {
            delete query.owners;
            query.status = ["public"];
        }

        logger.info("enter", {query});

        // Try to find records
        try {
            records = await ListSrv.client.find(
                new ListSrv.types.Query(req.query),
                logger.trackId
            );

            logger.info("list service find success", {
                count: records.length
            });
        }
        catch(error) {
            logger.error("list service find error", error);
            return res.serverError(error);
        }

        // Populate
        populate(records, lodash.flatten([req.query.populate]), {
            "items[].product": require("services/product"),
            "items[].product.mainProfileImage": require("services/file"),
            "items[].product.tags": require("services/tag"),
            "bannerImage": require("services/file")
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
            query = new ListSrv.types.Query(Object.assign(req.query, {
                users: [req.uid]
            }));

        logger.info("enter", {query: req.query});

        // Try to count records
        try {
            count = await ListSrv.client.count(query, logger.trackId);
            logger.info("list service count success", {count});
        }
        catch(error) {
            logger.error("list service count error", error);
            return res.serverError(error);
        }

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
            record = await ListSrv.client.findById(req.params.id, logger.trackId);
            logger.info("list service findById success", record);
        }
        catch(error) {
            logger.error("list service findById error", error);
            return res.serverError(error);
        }

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "items[].product": require("services/product"),
            "items[].product.mainProfileImage": require("services/file"),
            "items[].product.tags": require("services/tag"),
            "bannerImage": require("services/file")
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
            record = await ListSrv.client.findByNameId(req.params.id, logger.trackId);
            logger.info("list service findByNameId success", record);
        }
        catch(error) {
            logger.error("list service findByNameId error", error);
            return res.serverError(error);
        }

        // Populate
        populate([record], lodash.flatten([req.query.populate]), {
            "items[].product": require("services/product"),
            "items[].product.mainProfileImage": require("services/file"),
            "items[].product.tags": require("services/tag"),
            "bannerImage": require("services/file")
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

        // First find the list to check if user is authorized
        // to update.
        try {
            result = await ListSrv.client.findById(req.params.id, logger.trackId);
            logger.info("list service findById success", result);

            let ownerProfile = lodash.find(result.owners, (owner) => {
                return owner.user == req.uid;
            });

            if(!ownerProfile) {
                return res.serverError(new Types.ApiError({
                    code: Types.ErrorCode.UNAUTHORIZED,
                    message: "You must be an owner of this list to update it"
                }));
            }
        }
        catch(error) {
            logger.error("list service findById error", error);
            return res.serverError(error);
        }

        // Now try to update the record.
        try {
            result = await ListSrv.client.update(
                req.params.id,
                new ListSrv.types.Data(req.body),
                logger.trackId
            );

            logger.info("list service update success", result);
        }
        catch(error) {
            logger.error("list service update error", error);
            return res.serverError(error);
        }

        res.success(result);
    }

    /**
     * This function increments product quantity of a list.
     */
    async updateItem(req, res) {
        let result,
            logger = Logger.create("updateItem", req.trackId);

        logger.info("enter", req.body);

        // First find the list to check if user is authorized
        // to update.
        try {
            result = await ListSrv.client.findById(req.params.id, logger.trackId);
            logger.info("list service findById success", result);

            let ownerProfile = lodash.find(result.owners, (owner) => {
                return owner.user == req.uid;
            });

            if(!ownerProfile) {
                return res.serverError(new Types.ApiError({
                    code: Types.ErrorCode.UNAUTHORIZED,
                    message: "You must be an owner of this list to update it"
                }));
            }
        }
        catch(error) {
            logger.error("list service findById error", error);
            return res.serverError(error);
        }

        // Now let's update
        try {
            result = await ListSrv.client.updateItem(
                req.params.id,
                req.params.productId,
                new ListSrv.client.ItemData(req.body),
                logger.trackId
            );

            logger.info("list service updateItem success", result);
        }
        catch(error) {
            logger.error("list service updateItem error", error);
            return res.serverError(error);
        }

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
            result = await ListSrv.client.remove(
                req.params.id,
                logger.trackId
            );

            logger.info("list service remove success", result);
        }
        catch(error) {
            logger.error("list service remove error", error);
            return res.serverError(error);
        }

        res.success(result);
    }
};
