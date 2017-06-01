let NotificationSrv = require("services/notification"),
    //UserSrv         = require("services/user"),
    LoggerFactory   = require("common-logger"),
    Types           = require("types");

// Instantiate the logger factory.
let Logger = new LoggerFactory("notification.ctrl");

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
            result = await NotificationSrv.client.create(
                new NotificationSrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("notification service create error", error);
            return res.serverError(error);
        }

        logger.info("notification service create success", result);
        res.success(result);
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new NotificationSrv.types.Query(Object.assign(req.query, {
                users: [req.uid]
            }));

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await NotificationSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("notification service find error", error);
            return res.serverError(error);
        }

        logger.info("notification service find success", {
            count: records.length
        });

        res.success(records);
    }

    /**
     * This function count records matching a query in the system.
     */
    static async count(req, res) {
        let count,
            logger = Logger.create("count", req.trackId),
            query = new NotificationSrv.types.Query(Object.assign(req.query, {
                users: [req.uid]
            }));

        logger.info("enter", {query: req.query});

        // Try to count records
        try {
            count = await NotificationSrv.client.count(query, logger.trackId);
        }
        catch(error) {
            logger.error("notification service count error", error);
            return res.serverError(error);
        }

        logger.info("notification service count success", {count});

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
            record = await NotificationSrv.client.findById(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("notification service findById error", error);
            return res.serverError(error);
        }

        logger.info("notification service findById success", record);

        res.success(record);
    }

    /**
     * This function updates a record.
     */
    static async update(req, res) {
        let result,
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // Find notification by id.
        try {
            let notification = await NotificationSrv.client.findById(req.params.id);

            logger.info("notification service findById success", notification);

            // Error : user has no rights
            if(notification.users.indexOf(req.uid) < 0) {
                return res.unauthorized(
                    new Types.ApiError({
                        code: Types.ErrorCode.UNAUTHORIZED,
                        message: "you are not an owner of this notification"
                    })
                );
            }
        }
        catch(error) {
            logger.error("notification service findById error", error);
            return res.serverError(error);
        }

        // Now try to update notification.
        try {
            result = await NotificationSrv.client.update(
                req.params.id,
                new NotificationSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("notification service update error", error);
            return res.serverError(error);
        }

        logger.info("notification service update success", result);
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
            result = await NotificationSrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("notification service remove error", error);
            return res.serverError(error);
        }

        logger.info("notification service remove success", result);
        res.success(true);
    }
};
