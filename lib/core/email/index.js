let Kafka                           = require("utils/kafka"),
    InvitationHandler               = require("./handlers/invitation"),
    OrderPaymentAuthorizedHandler   = require("./handlers/order_payment_authorized"),
    OrderStatusUpdatedHandler       = require("./handlers/order_status_updated"),
    NewInvitationRequestHandler     = require("./handlers/new_invitation_request"),
    AdminNotificationHandler        = require("./handlers/admin_notification");

module.exports = class EmailSrv {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";

        this.invitationHandler = new InvitationHandler({mode});
        this.adminNotificationHandler = new AdminNotificationHandler({mode});
        this.orderPaymentAuthorizedHandler = new OrderPaymentAuthorizedHandler({mode});
        this.orderStatusUpdatedHandler = new OrderStatusUpdatedHandler({mode});
        this.newInvitationRequestHandler = new NewInvitationRequestHandler({mode});

        Kafka.on("email:invitation", this.invitationHandler.send.bind(this.invitationHandler));
        Kafka.on("email:admin_notification", this.adminNotificationHandler.send.bind(this.adminNotificationHandler));
        Kafka.on("email:order_payment_authorized", this.orderPaymentAuthorizedHandler.send.bind(this.orderPaymentAuthorizedHandler));
        Kafka.on("email:order_status_updated", this.orderStatusUpdatedHandler.send.bind(this.orderStatusUpdatedHandler));
        //Kafka.on("email:new_invitation_request", this.newInvitationRequestHandler.send);
    }
};