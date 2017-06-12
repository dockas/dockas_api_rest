let lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    Kafka               = require("utils/kafka");

let Logger = new LoggerFactory("billing.adaptors.moip.notification");

module.exports = class Handler {
    constructor(opts = {}) {
        this.api = opts.api;
    }

    /**
     * This function process a billing notification.
     */
    async process(
        data,
        trackId
    ) {
        let logger = Logger.create("create", trackId);
        logger.info("enter", data);

        let {event, resource} = data;

        switch(event) {
            case "ORDER.PAID": this.handleOrderPaidEvent(resource, trackId); break;
            default: break;
        }
    }

    /**
     * This function handles payment authorized event.
     */
    async handleOrderPaidEvent(
        resource={},
        trackId
    ) {
        let logger = Logger.create("handleOrderPaidEvent", trackId);
        logger.info("enter", resource);

        // Normalize resource to propagate it through the system.
        let notification = {
            type: "order.payment_succeeded",
            data: {
                order: lodash.get(resource, "order.id")
            }
        };

        // Propagate the event.
        Kafka.emit("billing:gateway_notification:order.payment_succeeded", {
            trackId,
            notification
        });
    }
};