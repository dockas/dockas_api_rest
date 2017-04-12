let UserSrv         = require("services/user"),
    LoggerFactory   = require("common-logger");

// Instantiate the logger factory.
let Logger = new LoggerFactory("user.ctrl");

/**
 * User controller class definition.
 */
module.exports = class Ctrl {
    /**
     * This function find generic users in the system.
     */
    static async find(req, res) {
        let users,
            logger = Logger.create("find", req.trackId),
            query = new UserSrv.types.Query(req.query);

        logger.info("enter", {query: req.query});

        // Try to find users
        try {
            users = await UserSrv.client.find(query, logger.trackId);
        }
        catch(error) {
            logger.error("user service find error", error);
            return res.serverError(error);
        }

        logger.info("user service find success", {
            count: users.length
        });

        res.success(users);
    }

    /**
     * This function signs a new user up.
     */
    static async signup(req, res) {
        let result,
            logger = Logger.create("signup", req.trackId);

        logger.info("enter", req.body);

        // Try to create a new user.
        try {
            result = await UserSrv.client.create(
                new UserSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("user service create error", error);
            return res.serverError(error);
        }

        logger.info("user service create success", result);
        res.success(result);
    }

    /**
     * This function find the current user info.
     */
    static async findMe(req, res) {
        let user,
            logger = Logger.create("findMe", req.trackId);

        logger.info("enter", {uid: req.uid});

        console.log(UserSrv.client);

        // Try to find current user by id
        try {
            user = await UserSrv.client.findById(req.uid, logger.trackId);
        }
        catch(error) {
            logger.error("user service findById error", error);
            return res.serverError(error);
        }

        logger.info("user service findById success", user);

        res.success(user);
    }

    /**
     * This function updates the current user.
     */
    static async update(req, res) {
        let result,
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // Try to update user profile.
        try {
            result = await UserSrv.client.update(
                req.uid,
                new UserSrv.types.Data(req.body),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("user service update error", error);
            return res.serverError(error);
        }

        logger.info("user service update success", result);
        res.success(true);
    }
};
