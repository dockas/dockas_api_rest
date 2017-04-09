/* global describe,before,after,it */

let chai            = require("chai"),
    chaiAsPromised  = require("chai-as-promised"),
    Mongo           = require("common-utils/lib/mongo"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger"),
    Types           = require("./types"),
    Srv             = require("./index");

// Setup chai
chai.should();
chai.use(chaiAsPromised);

// Instantiate the logger
let Logger = new LoggerFactory("auth test");

describe("auth service", function() {
    let _db, _token, srv;

    // Initilize test environment.
    before(function(){
        let logger = Logger.create("before");
        logger.info("enter");

        return Mongo.connect(config.db.mongo.testUrl)
        .then((db) => {
            _db = db;

            srv = new Srv({db: db, mode: "test"});
        });
    });

    // Finalize test environment.
    after(function(done) {
        let logger = Logger.create("after");
        logger.info("enter");

        // Close mongoose connection.
        _db.close(done);
    });

    describe("signin function", function() {
        it("should succes with valid email and password", function() {
            return srv.signin(
                "root@dockas.com",
                "Mula*8"
            ).should.eventually.be.a("string").then((token) => {
                _token = token;
            });
        });

        it("should fail with invalid email", function() {
            return srv.signin(
                "invalidtest@dockas.com",
                "Mula*8"
            ).should.be.rejected
            .and.eventually.have.property("code", Types.ErrorCode.INVALID_EMAIL_OR_PASSWORD);
        });

        it("should fail with invalid password", function() {
            return srv.signin(
                "root@dockas.com",
                "Mula*9"
            ).should.be.rejected
            .and.eventually.have.property("code", Types.ErrorCode.INVALID_EMAIL_OR_PASSWORD);
        });
    });

    describe("signed function", function() {
        it("should success with valid token", function() {
            return srv.signed(_token)
            .should.eventually.be.a("string");
        });

        it("should fail with invalid token", function() {
            return srv.signed("invalidtoken")
            .should.be.rejected
            .and.eventually.have.property("code", Types.ErrorCode.INVALID_AUTH_TOKEN);
        });
    });

    describe("signout function", function() {
        it("should success with valid token", function() {
            return srv.signout(_token)
            .should.be.fulfilled.then(() => {
                return srv.signed(_token);
            })
            .should.be.rejected
            .and.eventually.have.property("code", Types.ErrorCode.INVALID_AUTH_TOKEN);
        });
    });
});

