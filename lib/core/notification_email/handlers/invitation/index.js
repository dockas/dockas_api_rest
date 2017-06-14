module.exports = class OrderHandler {
    constructor({
        mode="production"
    }={}) {
        this.mode = mode;
    }

    sendAccepted(message, opts) {
        return require("./accepted")(message, Object.assign({}, opts, {
            mode: this.mode
        }));
    }
};