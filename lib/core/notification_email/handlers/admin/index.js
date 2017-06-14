module.exports = class AdminHandler {
    constructor({
        mode="production"
    }={}) {
        this.mode = mode;
    }

    sendMessage(message) {
        return require("./message")(message, {mode: this.mode});
    }
};