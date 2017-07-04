module.exports = class OrderHandler {
    constructor({
        mode="production"
    }={}) {
        this.mode = mode;
    }

    sendPaymentAuthorized(message, opts) {
        return require("./payment_authorized")(message, Object.assign({}, opts, {
            mode: this.mode
        }));
    }

    sendStatusUpdated(message, opts) {
        return require("./status_updated")(message, Object.assign({}, opts, {
            mode: this.mode
        }));
    }
};