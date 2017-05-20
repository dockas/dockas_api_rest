/* global __dirname */

global.__rootdir = __dirname;

let LoggerFactory   = require("common-logger"),
    config          = require("common-config"),
    mkdirp          = require("mkdirp");

// Create logs dir
mkdirp("logs");

// Bootstrap logger factory.
LoggerFactory.service_name = require("./package.json").name;
LoggerFactory.logstashWinstonHost = process.env.LOGSTASH_WINSTON_HOST;
LoggerFactory.useFileLogger = true;

// Bootstrap server.
let Server = require("./lib/server");
(new Server()).listen(process.env.PORT||config.port);


/*let qrcode = require("qrcode");

qrcode.toFile("./files/qrcodes/test.png", "teste", {
    scale: 10
}, (error) => {
    console.error("qrcode error", error);
});*/