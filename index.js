let LoggerFactory   = require("common-logger"),
    config          = require("common-config");

// Bootstrap logger factory.
LoggerFactory.service_name = require("./package.json").name;
LoggerFactory.logstashWinstonHost = process.env.LOGSTASH_WINSTON_HOST;

// Bootstrap server.
let Server = require("./lib/server");
(new Server()).listen(process.env.PORT||config.port);