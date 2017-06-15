let lodash          = require("lodash"),
    crypto          = require("crypto"),
    UserSrv         = require("services/user"),
    InvitationSrv   = require("services/invitation"),
    BillingSrv      = require("services/billing"),
    LoggerFactory   = require("common-logger"),
    adminPol        = require("policies/admin"),
    populate        = require("common-utils/lib/populate"),
    Notification    = require("utils/notification");

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

        // Populate
        populate(users, lodash.flatten([req.query.populate]), {
            "brands": require("services/brand"),
            "lists": require("services/list")
        }).then((users) => {
            logger.debug("service populate success");
            res.success(users);
        });
    }

    /**
     * This function signs a new user up.
     */
    static async signup(req, res) {
        let result,
            invitation,
            data = req.body,
            invitationId = data.invitation,
            logger = Logger.create("signup", req.trackId);

        logger.info("enter", req.body);

        // Try to validate invitation
        try {
            invitation = await InvitationSrv.client.findById(invitationId);
            logger.debug("invitation service findById success", invitation);

            if(invitation.status == InvitationSrv.types.STATUS_CLOSED) {
                return res.serverError(new InvitationSrv.types.InvitationError({
                    code: InvitationSrv.types.ErrorCode.INVITATION_CLOSED,
                    message: "user already created"
                }));
            }
        }
        catch(error) {
            logger.error("invitation service findById error", error);
            return res.serverError(error);
        }

        // Set postalCodeAddress from invitation.
        data.postalCodeAddress = invitation.postalCodeAddress;

        // Remove invitation
        delete data.invitation;

        // Try to create user
        try {
            result = await UserSrv.client.create(
                new UserSrv.types.Data(req.body),
                logger.trackId
            );

            logger.info("user service create success", result);
        }
        catch(error) {
            logger.error("user service create error", error);
            return res.serverError(error);
        }

        // Try to close the invitation
        try {
            await InvitationSrv.client.update(invitationId, {
                status: InvitationSrv.types.STATUS_CLOSED
            }, logger.trackId);

            logger.debug("invitation service update success");
        }
        catch(error) {
            logger.error("invitation service update error", error);
        }

        // Try to create billing customer
        /*try {
            let customerResult = await BillingSrv.client.customerCreate({
                _id: result,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                address: invitation.address     // This is for Moip and don't make any sense! :)
            }, logger.trackId);

            logger.info("billing service createCustomer success", customerResult);
        }
        catch(error) {
            logger.error("billing service createCustomer error", error);

            // @TODO : We should keep trying to create customer profile in case of error.
        }*/

        // Emit notifications
        Notification.emit([{
            channel: "email",
            roles: ["admin"],
            type: "admin:message",
            body: {
                subject: "new_user",
                data: result
            }
        }]);
        
        res.success(result);
    }

    /**
     * This function find the current user info.
     */
    static async findMe(req, res) {
        let user,
            logger = Logger.create("findMe", req.trackId);

        logger.info("enter", {uid: req.uid});

        // Try to find current user by id
        try {
            user = await UserSrv.client.findById(req.uid, logger.trackId);
        }
        catch(error) {
            logger.error("user service findById error", error);
            return res.serverError(error);
        }

        logger.info("user service findById success", user);

        // Send new_user email to admins.
        /*Email.shared.sendToAdmins("email:admin_notification", {
            subject: "new_user",
            data: {macuna: "teste"}
        });*/

        res.success(user);
    }

    /**
     * This function updates the current user.
     */
    static async update(req, res) {
        let result,
            uid = req.uid,
            logger = Logger.create("update", req.trackId);

        logger.info("enter", req.body);

        // Only admins can update other users
        if(req.body._id && req.body._id != req.uid) {
            let isAdmin = await adminPol(req, res);

            if(isAdmin) {
                uid = req.body._id;
                delete req.body._id;
            }
            else {return;}
        }

        // Try to update user profile.
        try {
            result = await UserSrv.client.update(
                uid,
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

    /**
     * This function add an address to current user profile.
     */
    static async addAddress(req, res) {
        let result,
            logger = Logger.create("addAddress", req.trackId);

        logger.info("enter", req.body);

        let address = lodash.assign(req.body, {
            _id: crypto.randomBytes(20).toString("hex")
        });

        // Try to update user profile.
        try {
            result = await UserSrv.client.addItems(
                req.uid,
                new UserSrv.types.AddItemData({
                    addresses: [address],
                    phones: [address.phone]
                }),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("user service addAddress error", error);
            return res.serverError(error);
        }

        logger.info("user service addAddress success", result);
        res.success(result);
    }

    /**
     * This function remove an address from current user profile.
     */
    static async removeAddress(req, res) {
        let result,
            logger = Logger.create("removeAddress", req.trackId);

        logger.info("enter", req.params);

        // Try to update user profile.
        try {
            result = await UserSrv.client.remove(
                req.uid,
                new UserSrv.types.RemoveItemData({
                    addresses: [req.params.id]
                }),
                logger.trackId
            );
        }
        catch(error) {
            logger.error("user service removeAddress error", error);
            return res.serverError(error);
        }

        logger.info("user service removeAddress success", result);
        res.success(true);
    }
};
