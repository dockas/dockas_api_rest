/* global describe,before,after,it */

let chai            = require("chai"),
    chaiAsPromised  = require("chai-as-promised"),
    Mongo           = require("common-utils/lib/mongo"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger"),
    hash            = require("utils/hash"),
    Srv             = require("./index");

// Setup chai
chai.should();
chai.use(chaiAsPromised);

// Instantiate the logger
let Logger = new LoggerFactory("user test");

describe("user service", function() {
    let _db,
        srv = null;

    // Initilize test environment.
    before(function(done){
        let logger = Logger.create("before");
        logger.info("enter");

        Mongo.connect(config.db.mongo.testUrl)
        .then((db) => {
            _db = db;

            // Setup collections
            Promise.all([
                Srv.setupCollection(db)
            ]).then(() => {
                srv = new Srv({db: db, mode: "test"});
                done();
            });
        });
    });

    // Finalize test environment.
    after(function(done) {
        let logger = Logger.create("after");
        logger.info("enter");

        // Close mongoose connection.
        _db.close(done);
    });

    describe("hash function", function() {
        it("should success and return hash", function() {
            return hash("test").should.eventually.be.a("string");
        });
    });

    describe("create function", function() {
        it("should success and return an user id", function() {
            return srv.create({
                fullName: "Dockas Test",
                email: "test@dockas.com",
                password: "Mula*8"
            }).should.eventually.be.a("string").then(() => {
                //_id = id;
            });
        });
    });

    /*describe("remove function", function() {
        it("should success with valid user id", function() {
            return srv.remove(_id)
            .should.be.fulfilled.then(() => { _id = null; });
        });

        it("should fail with invalid user id", function() {
            return srv.remove("invaliduserid")
            .should.be.rejected;
        });
    });*/
});

