let EventEmitter = require("events");
let emitter = new EventEmitter();

module.exports = class Kafka {
    static emit(event, data) {
        emitter.emit(event, data);
    }

    static on(event, cb) {
        emitter.on(event, cb);
    }
};