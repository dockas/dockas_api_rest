/* global describe,before,after,it */

let chai            = require("chai"),
    chaiAsPromised  = require("chai-as-promised"),
    hasIntlLocales  = require("intl-locales-supported"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger"),
    Handler         = require("./index");

// Supported locales
let supportedLocales = [
    "pt-br"
];

// Setup chai
chai.should();
chai.use(chaiAsPromised);

// Instantiate the logger
let Logger = new LoggerFactory("notification sms test");

describe("notification sms service", function() {
    let handler = null;

    // Initilize test environment.
    before(function(){
        let logger = Logger.create("before");
        logger.info("enter");

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

        handler = new Handler({mode: "test"});
    });

    // Finalize test environment.
    after(function() {
        let logger = Logger.create("after");
        logger.info("enter");
    });

    describe("payment_authorized", function() {
        it("should send with valid data", function() {
            return handler.sendPaymentAuthorized({
                to: [config.sms.testTo],
                body: {
                    data: {
                        count: 233,
                        items: [
                            {
                                product: {
                                    name: "Banana",
                                    mainProfileImage: {
                                        path: "2016/09/03/20/48/bananas-1642706_1280.jpg"
                                    }
                                },
                                quantity: 12,
                                priceValue: 9900
                            },
                            {
                                product: {
                                    name: "Orange",
                                    mainProfileImage: {
                                        path: "2013/07/18/20/25/orange-164985_1280.jpg"
                                    }
                                },
                                quantity: 4,
                                priceValue: 1850
                            }
                        ]
                    }
                }
            }).should.eventually.be.fulfilled;
        });
    });

    describe("status_updated", function() {
        it("should send with valid data", function() {
            return handler.sendStatusUpdated({
                to: [config.sms.testTo],
                body: {
                    data: {
                        count: 233,
                        status: "delivering"
                    }
                }
            }, {
                imagesBaseUrl: "https://cdn.pixabay.com/photo"
            }).should.eventually.be.fulfilled;
        });
    });
});

