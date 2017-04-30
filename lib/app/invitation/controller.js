let lodash          = require("lodash"),
    InvitationSrv   = require("services/invitation"),
    UserSrv         = require("services/user"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("invitation.ctrl");

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

        // First check if there isn't any user with the provided
        // email.
        try {
            let isAvailable = await UserSrv.client.isEmailAvailable(
                data.email, 
                logger.trackId
            );

            if(!isAvailable) {
                return res.serverError(new UserSrv.types.UserError({
                    code: UserSrv.types.ErrorCode.USER_ALREADY_EXISTS,
                    message: "user already created"
                }));
            }
        }
        catch(error) {
            return res.serverError(error);
        }

        // Try to create a new entity.
        try {
            result = await InvitationSrv.client.create(
                new InvitationSrv.types.Data(data),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("invitation service create error", error);
            return res.serverError(error);
        }

        logger.info("invitation service create success", result);
        res.success(result);
    }

    /**
     * This function creates a new record.
     */
    static async send(req, res) {
        let result,
            logger = Logger.create("send", req.trackId);

        logger.info("enter", {id: req.params.id});

        // Try to approve
        try {
            result = await InvitationSrv.client.send(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("invitation service send error", error);
            return res.serverError(error);
        }

        logger.info("invitation service send success", result);
        res.success(result);
    }

    /**
     * This function find generic records in the system.
     */
    static async find(req, res) {
        let records,
            logger = Logger.create("find", req.trackId),
            query = new InvitationSrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find records
        try {
            records = await InvitationSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("invitation service find error", error);
            return res.serverError(error);
        }

        logger.info("invitation service find success", {
            count: records.length
        });

        res.success(records);
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
            record = await InvitationSrv.client.findById(req.params.id, logger.trackId);
        }
        catch(error) {
            logger.error("invitation service findById error", error);
            return res.serverError(error);
        }

        logger.info("invitation service findById success", record);

        res.success(record);
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
            result = await InvitationSrv.client.update(
                req.params.id,
                new InvitationSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("invitation service update error", error);
            return res.serverError(error);
        }

        logger.info("invitation service update success", result);
        res.success(true);
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
            result = await InvitationSrv.client.remove(
                req.params.id,
                logger.trackId
            );
        }
        catch(error) {
            logger.error("invitation service remove error", error);
            return res.serverError(error);
        }

        logger.info("invitation service remove success", result);
        res.success(true);
    }
};
