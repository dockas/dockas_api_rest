/* global describe,before,after,it */

let chai            = require("chai"),
    chaiAsPromised  = require("chai-as-promised"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger"),
    Handler         = require("./index");

// Setup chai
chai.should();
chai.use(chaiAsPromised);

// Instantiate the logger
let Logger = new LoggerFactory("email handler invitation test");

describe("email handler invitation service", function() {
    let handler = null;

    // Initilize test environment.
    before(function(){
        let logger = Logger.create("before");
        logger.info("enter");

        handler = new Handler({mode: "test"});
    });

    // Finalize test environment.
    after(function() {
        let logger = Logger.create("after");
        logger.info("enter");
    });

    describe("accepted", function() {
        it("should send with valid data", function() {
            return handler.sendAcceptedEmail({
                to: [config.email.testTo],
                body: {
                    data: {
                        _id: "2u91239jsi0"
                    }
                }
            }).should.eventually.be.fulfilled;
        });
    });
});

