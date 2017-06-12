let lodash              = require("lodash"),
    config              = require("common-config"),
    Api                 = require("./api"),
    CustomerHandler     = require("./customer"),
    OrderHandler        = require("./order"),
    ChargeHandler       = require("./charge"),
    SourceHandler       = require("./source"),
    NotificationHandler = require("./notification");

/**
 * Moip adaptor
 */
module.exports = class Adaptor {
    constructor() {
        let api = new Api();

        // Id
        this.id = "moip";

        // Instantiate the handlers.
        this.customerHandler = new CustomerHandler({api});
        this.orderHandler = new OrderHandler({api});
        this.chargeHandler = new ChargeHandler({api});
        this.sourceHandler = new SourceHandler({api});
        this.notificationHandler = new NotificationHandler({api});

        // Let register notifications endpoints
        api.notificationFind().then(async (response) => {
            console.log("notifications", response);

            let promises = [];

            if(response.length) { 
                if(response.length > 1) {
                    for(let i = 1; i < response.length; i++) {
                        if((/dockas/g).test(response[i].target)) {continue;}
                        promises.push(api.notificationRemove(response[i].id));
                    }
                }
            }

            try {
                await Promise.all(promises);

                // Create notification.
                api.notificationCreate({
                    events: [
                        "ORDER.*",
                        "PAYMENT.AUTHORIZED",
                        "PAYMENT.CANCELLED"
                    ],
                    target: lodash.get(config, "billing.adaptors.moip.notifications.url"),
                    media: "WEBHOOK"
                }).then((response) => {
                    console.log("api notificationCreate success", response);
                }).catch((error) => {
                    console.log("api notificationCreate error", error);
                });
            }
            catch(error) {
                console.log("api notificationRemove error", error);
            }
        });
    }

    /**
     * This function creates a customer
     */
    async customerCreate(
        data,
        trackId
    ) {
        return await this.customerHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function creates an order.
     */
    async orderCreate(
        data,
        trackId
    ) {
        return await this.orderHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function creates a charge.
     */
    async chargeCreate(
        data,
        trackId
    ) {
        return await this.chargeHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function finds a charge by it's unique id.
     */
    async chargeFindById(
        id,
        trackId
    ) {
        return await this.chargeHandler.findById(
            id,
            trackId
        );
    }

    /**
     * This function creates a payment source.
     */
    async sourceCreate(
        data,
        trackId
    ) {
        return await this.sourceHandler.create(
            data,
            trackId
        );
    }

    /**
     * This function removes a payment source.
     */
    async sourceRemove(
        id,
        trackId
    ) {
        return await this.sourceHandler.remove(
            id,
            trackId
        );
    }

    /**
     * This function process notification.
     */
    async notificationProcess(
        data,
        trackId
    ) {
        console.log("MOIP notificationProcess", data);

        return await this.notificationHandler.process(
            data,
            trackId
        );
    }
};