let Kafka                           = require("utils/kafka"),
    ListSubscriptionHandler         = require("./handlers/list_subscription"),
    InvitationHandler               = require("./handlers/invitation"),
    OrderHandler                    = require("./handlers/order"),
    AdminHandler                    = require("./handlers/admin");

module.exports = class EmailSrv {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts = {}) {
        let mode = opts.mode || "production";

        this.listSubscriptionHandler = new ListSubscriptionHandler({mode});
        this.invitationHandler = new InvitationHandler({mode});
        this.orderHandler = new OrderHandler({mode});
        this.adminHandler = new AdminHandler({mode});

        Kafka.on("notification:email:invitation:accepted", this.invitationHandler.sendAccepted.bind(this.invitationHandler));
        Kafka.on("notification:email:admin:message", this.adminHandler.sendMessage.bind(this.adminHandler));
        Kafka.on("notification:email:order:payment_authorized", this.orderHandler.sendPaymentAuthorized.bind(this.orderHandler));
        Kafka.on("notification:email:order:status_updated", this.orderHandler.sendStatusUpdated.bind(this.orderHandler));
        Kafka.on("notification:email:list_subscription:order_created", this.listSubscriptionHandler.sendOrderCreated.bind(this.listSubscriptionHandler));
    }
};