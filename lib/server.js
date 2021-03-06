/* globals __dirname,Intl */

/**
 * This module is responsible for declaring the server class.
 *
 * @module
 *     server
 * @copyright
 *     Bruno Fonseca
 */
let http                    = require("http"),
    mkdirp                  = require("mkdirp"),
    Mongo                   = require("common-utils/lib/mongo"),
    Counter                 = require("common-utils/lib/counter"),
    config                  = require("common-config"),
    LoggerFactory           = require("common-logger"),
    express                 = require("express"),
    cookieParser            = require("cookie-parser"),
    bodyParser              = require("body-parser"),
    methodOverride          = require("method-override"),
    lodash                  = require("lodash"),
    hasIntlLocales          = require("intl-locales-supported"),


    AuthSrv                 = require("services/auth"),
    UserSrv                 = require("services/user"),
    FileSrv                 = require("services/file"),
    ProductSrv              = require("services/product"),
    TagSrv                  = require("services/tag"),
    PriceSrv                = require("services/price"),
    OrderSrv                = require("services/order"),
    OrderItemSrv            = require("services/order_item"),
    InvitationSrv           = require("services/invitation"),
    NotificationAlertSrv    = require("services/notification_alert"),
    CouponSrv               = require("services/coupon"),
    BrandSrv                = require("services/brand"),
    CompanySrv              = require("services/company"),
    ListSrv                 = require("services/list"),
    ListSubscriptionSrv     = require("services/list_subscription"),
    BillingSrv              = require("services/billing"),
    AddressSrv              = require("services/address"),
    WalletSrv               = require("services/wallet"),
    TransferSrv             = require("services/transfer"),

    NotificationEmailCoreSrv    = require("core/notification_email"),
    NotificationSMSCoreSrv      = require("core/notification_sms"),
    SocketCoreSrv               = require("core/socket"),

    Socket                  = require("utils/socket"),
    Arango                  = require("utils/arango");

// Instantiate the logger factory.
let Logger = new LoggerFactory("server");

let supportedLocales = [
    "pt-br"
];

/**
 * Server class definition
 */
module.exports = class Server {
    constructor() {
        this.app = express();
        this.server = http.Server(this.app);
        this.init = Promise.resolve();
        
        if (global.Intl) {
            // Determine if the built-in `Intl` has the locale data we need.
            if (!hasIntlLocales(supportedLocales)) {
                // `Intl` exists, but it doesn't have the data we need, so load the
                // polyfill and patch the constructors we need with the polyfill's.
                let IntlPolyfill = require("intl");
                Intl.NumberFormat = IntlPolyfill.NumberFormat;
                Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
            }
        } else {
            // No `Intl`, so use and load the polyfill.
            global.Intl = require("intl");
        }

        new Socket({shared: true});

        this.setupDirs();
        this.setupDatabase();
        this.setupCounter();
        this.setupServices();
        this.setupApp();
        this.setupRoutes();
        this.listenHealthCheck();

        //let formatter = new Intl.NumberFormat("pt-br");

        // Check if intl is working
        /*console.log("########", {
            number: formatter.format(6373.93)
        });*/
    }

    /**
     * This function makes required directories.
     */
    setupDirs() {
        mkdirp.sync(__dirname+"/../"+config.files.dir);
        mkdirp.sync(__dirname+"/../"+config.qrcodes.dir);
    }

    /**
     * This function sets up databases.
     */
    setupDatabase() {
        let logger = Logger.create("setupDatabase");
        logger.info("enter");

        this.init = this.init.then(() => {
            // Connects to mongo.
            return Mongo.connect(
                config.db.mongo.url, 
                {setAsDefault: true}
            );
        }).then(() => {
            return Arango.connect(
                config.db.arango.url, 
                config.db.arango.database,
                {setAsDefault: true}
            );
        });
    }

    /**
     * This function setups the counter service.
     */
    setupCounter() {
        let logger = Logger.create("setupCounter");
        logger.info("enter");

        this.init = this.init.then(() => {
            return Counter.setupCollection(Mongo.db).then(() => {
                new Counter({shared: true});
            });
        });
    }

    /**
     * This function sets up the services.
     */
    setupServices() {
        this.init = this.init.then(() => {
            // Instantiate independent core services.
            new NotificationEmailCoreSrv({mode: process.env.NODE_ENV});
            new NotificationSMSCoreSrv({mode: process.env.NODE_ENV});
            new SocketCoreSrv(this.server, {mode: process.env.NODE_ENV});

            return Promise.all([
                AuthSrv.connect(),
                UserSrv.connect(),
                FileSrv.connect(),
                ProductSrv.connect(),
                TagSrv.connect(),
                PriceSrv.connect(),
                OrderSrv.connect(),
                InvitationSrv.connect(),
                NotificationAlertSrv.connect(),
                CouponSrv.connect(),
                BrandSrv.connect(),
                ListSrv.connect(),
                ListSubscriptionSrv.connect(),
                CompanySrv.connect(),
                BillingSrv.connect(),
                AddressSrv.connect(),
                WalletSrv.connect(),
                TransferSrv.connect(),
                OrderItemSrv.connect()
            ]);
        });
    }

    /**
     * This function sets up the express app.
     */
    setupApp() {
        // Method override
        this.app.use(methodOverride());

        // Set headers
        this.app.use(function(req, res, next) {
            // TODO : strict allowed origins
            res.header("Access-Control-Allow-Origin", req.headers.origin);
            res.header("Access-Control-Allow-Credentials", true);
            res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
            res.header("Access-Control-Allow-Headers", "Keep-Alive,User-Agent,Cache-Control,Content-Type,Authorization");

            // intercept OPTIONS method
            if ("OPTIONS" == req.method) { res.sendStatus(200); }
            else { next(); }
        });

        // Process query
        this.app.use(function(req, res, next) {
            let logger = Logger.create("process query");

            if(req.query.limit){req.query.limit = parseInt(req.query.limit);}
            if(req.query.skip){req.query.skip = parseInt(req.query.skip);}
            if(req.query.sort){
                let parsedSort = {};

                lodash.forOwn(req.query.sort, (value, key) => {
                    try {parsedSort[key] = parseInt(value);}
                    catch(error) {logger.error("parse sort error", {key, value});}
                });

                req.query.sort = parsedSort;
            }
            
            next();
        });

        // Setup express to work behind a reverse proxy (nginx) and therefore to capture
        // the client IP forwarded by nginx.
        this.app.enable("trust proxy");

        // Setup a middleware to parse the request"s body.
        this.app.use(bodyParser.urlencoded({extended: true}));

        // Setup a middleware to parse body json.
        this.app.use(bodyParser.json({
            limit: "1mb"
        }));

        // Setup a middleware to parse cookies on request.
        this.app.use(cookieParser(config.secrets.cookie));

        // Resolve user auth token.
        this.app.use(function(req, res, next) {
            let logger = Logger.create("token middleware");

            // Get token from request.
            let token = null;

            if(req.query && req.query.token) {token = req.query.token;}
            else if(req.body && req.body.token) {token = req.body.token;}
            else if(req.headers && req.headers.authorization) {
                let authorization = req.headers.authorization,
                    part = authorization.split(" ");

                if (part.length === 2) {
                    token = part[1];
                }
            }

            logger.debug("enter", {token: Logger.secret(token)});

            req.token = token;

            next();
        });

        // Log request
        this.app.use(function(req, res, next) {
            let logger = Logger.create("request");

            // Print sensitive data comming from client
            logger.info("enter", {
                method: req.method,
                protocol: req.protocol,
                originalUrl: req.originalUrl,
                hostname: req.hostname,
                ip: req.ip
            });

            // Set trackId on request to be reused through controller functions.
            req.trackId = logger.trackId;

            next();
        });

        // Setup default handling functions.
        this.app.use(function(req, res, next) {
            res.badRequest = function(message) {
                res.status(400).json({message: message});
            };

            res.unauthorized = function(message) {
                res.status(401).json({message: message});
            };

            res.forbidden = function(message) {
                res.status(403).json({message: message});
            };

            res.notFound = function(message) {
                res.status(404).json({message: message});
            };

            res.serverError = function(error) {
                res.status(500).json(error);
            };

            res.success = function(data, opts={}) {
                let sendObj = lodash.isArray(data)?
                {results: lodash.map(data, (item) => {return !lodash.isNull(item) ? item : undefined;})} : 
                {result: lodash.isObject(data)?lodash.omitBy(data, lodash.isNull):data};

                sendObj = Object.assign({}, opts, sendObj);

                res.status(200).json(sendObj);
            };

            next();
        });
    }

    /**
     * This function sets up the express app routes.
     */
    setupRoutes() {
        this.init = this.init.then(() => {
            this.app.use("/auth", require("app/auth")());
            this.app.use("/user", require("app/user")());
            this.app.use("/file", require("app/file")());
            this.app.use("/product", require("app/product")());
            this.app.use("/tag", require("app/tag")());
            this.app.use("/price", require("app/price")());
            this.app.use("/order/item", require("app/order_item")());
            this.app.use("/order", require("app/order")());
            this.app.use("/invitation", require("app/invitation")());
            this.app.use("/notification/alert", require("app/notification_alert")());
            this.app.use("/coupon", require("app/coupon")());
            this.app.use("/brand", require("app/brand")());
            this.app.use("/list/subscription", require("app/list_subscription")());
            this.app.use("/list", require("app/list")());
            this.app.use("/company", require("app/company")());
            this.app.use("/config", require("app/config")());
            this.app.use("/billing", require("app/billing")());
            this.app.use("/address", require("app/address")());
        });
    }

    /**
     * Listen to health check requests
     */
    listenHealthCheck() {
        let healthCheckServer = http.createServer(function(req, res) {
            res.writeHead(200); res.end();
        });

        // Start listen
        healthCheckServer.listen(process.env.CHECK_PORT);
    }

    /**
     * This function instruct server to listen in a specif port
     */
    listen(port = process.env.PORT) {
        let logger = Logger.create("listen");

        this.init.then(() => {
            this.server.listen(port);
            logger.info("server bootstraped", {port: port});
        });        
    }
};
