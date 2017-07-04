/* global describe,before,after,it */

let chai            = require("chai"),
    chaiAsPromised  = require("chai-as-promised"),
    LoggerFactory   = require("common-logger"),
    Srv             = require("./index");

// Setup chai
chai.should();
chai.use(chaiAsPromised);

// Instantiate the logger
let Logger = new LoggerFactory("address test");

describe("address service test", function() {
    let srv = null;

    // Initilize test environment.
    before(function(){
        let logger = Logger.create("before");
        logger.info("enter");

        srv = new Srv({mode: "test"});
    });

    // Finalize test environment.
    after(function() {
        let logger = Logger.create("after");
        logger.info("enter");
    });

    describe("findByPostalCode", function() {
        it("should success with valid postal_code", function() {
            return srv.findByPostalCode(
                "30350140",
                "BRA"
            ).should.eventually.be.an("object")
            .and.have.property("street", "Rua Professor Arduino Bolivar");
        });

        it("should fail with invalid postal_code", function() {
            return srv.findByPostalCode(
                "11111111",
                "BRA"
            ).should.eventually.be.rejected;
        });
    });
});

