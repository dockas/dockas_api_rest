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
let Logger = new LoggerFactory("email handler admin test");

describe("email handler admin service", function() {
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

    describe("message", function() {
        it("should send with valid data", function() {
            return handler.sendMessage({
                to: [config.email.testTo],
                body: {
                    subject: "subject_new_invitation",
                    data: {
                        hello: "world"
                    }
                }
            }).should.eventually.be.fulfilled;
        });
    });
});

