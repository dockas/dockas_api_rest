/* global describe,before,after,it */

let chai            = require("chai"),
    chaiAsPromised  = require("chai-as-promised"),
    Mongo           = require("common-utils/lib/mongo"),
    config          = require("common-config"),
    LoggerFactory   = require("common-logger"),
    Types           = require("../types"),
    Srv             = require("./index");

// Setup chai
chai.should();
chai.use(chaiAsPromised);

// Instantiate the logger
let Logger = new LoggerFactory("tag test");

describe("tag service", function() {
    let _db, _id, srv;

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

    describe("create function", function() {
        it("should success with valid data", function() {
            return srv.create({
                creator: "userid",
                name: "a tag name",
                textColor: "#ffffff",
                backgroundColor: "#000000"
            }).should.eventually.be.a("string")
            .then((id) => {
                _id = id;
            });
        });

        it("should fail with missing required textColor field", function() {
            return srv.create({
                creator: "userid",
                name: "a tag name",
                backgroundColor: "#000000"
            }).should.be.rejected
            .and.eventually.have.property("code", Types.ErrorCode.INVALID_SCHEMA);
        });
    });

    describe("findById function", function() {
        it("should success with valid id", function() {
            return srv.findById(_id)
            .should.eventually.be.an("object")
            .and.have.property("name", "a tag name");
        });

        it("should fail with invalid id", function() {
            return srv.findById("invalidid")
            .should.be.rejected
            .and.eventually.have.property("code", Types.ErrorCode.DB_ERROR);
        });
    });

    describe("update function", function() {
        it("should success with valid data", function() {
            return srv.update(_id, {
                textColor: "#eeeeee"
            }).should.be.fulfilled.then(() => {
                return srv.findById(_id);
            }).should.eventually.have.property("textColor", "#eeeeee");
        });
    });

    describe("find function", function() {
        it("should success with valid id", function() {
            return srv.find({_id: [_id]})
            .should.be.fulfilled
            .and.eventually.be.an("array")
            .that.have.lengthOf(1);
        });

        it("should fail with invalid data");
    });

    describe("remove function", function() {
        it("should success with valid id", function() {
            return srv.remove(_id).should.be.fulfilled.then(() => {
                return srv.findById(_id);
            }).should.be.rejected
            .and.eventually.have.property("code", Types.ErrorCode.NOT_FOUND);
        });

        it("should fail with invalid id", function() {
            return srv.remove("invalidid")
            .should.be.rejected
            .and.eventually.have.property("code", Types.ErrorCode.DB_ERROR);
        });
    });
});
