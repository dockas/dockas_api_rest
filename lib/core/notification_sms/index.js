let Kafka           = require("utils/kafka"),
    OrderHandler    = require("./handlers/order");

module.exports = class EmailSrv {
    /**
     * This function constructs a new instance of this service.
     */
    constructor(opts={}) {
        let mode = opts.mode || "production";

        this.orderHandler = new OrderHandler({mode});

        Kafka.on("notification:sms:order:payment_authorized", this.orderHandler.sendPaymentAuthorized.bind(this.orderHandler));
        Kafka.on("notification:sms:order:status_updated", this.orderHandler.sendStatusUpdated.bind(this.orderHandler));
        Kafka.on("notification:sms:list:order:created", this.orderHandler.sendListOrderCreated.bind(this.orderHandler));
    }
};
