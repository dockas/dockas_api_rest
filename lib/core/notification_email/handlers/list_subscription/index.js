module.exports = class ListSubscriptionHandler {
    constructor({
        mode="production"
    }={}) {
        this.mode = mode;
    }

    sendOrderCreated(message, opts) {
        return require("./order_created")(message, Object.assign({}, opts, {
            mode: this.mode
        }));
    }
};