/* global describe,before,after,it */

let chai            = require("chai"),
    chaiAsPromised  = require("chai-as-promised"),
    LoggerFactory   = require("common-logger"),
    moment          = require("moment"),
    Utils           = require("./utils");

// Setup chai
chai.should();
chai.use(chaiAsPromised);

// Instantiate the logger
let Logger = new LoggerFactory("list subscription utils test");
let {expect} = chai;

describe("utils test", function() {
    // Initilize test environment.
    before(function(){
        let logger = Logger.create("before");
        logger.info("enter");
    });

    // Finalize test environment.
    after(function() {
        let logger = Logger.create("after");
        logger.info("enter");
    });

    describe("getNextDeliverDate function", function() {
        it("should get the second sunday from friday in weekly recurrence mode", function() {
            let fridayMoment = moment().isoWeekday("Friday");

            expect(Utils.getNextDeliverDate("weekly", {
                startDate: fridayMoment.toISOString()
            })).to.be.equal(
                fridayMoment.endOf("isoWeek").add(1,"week").minute(0).hour(12).toISOString()
            );
        });

        it("should get the first sunday from wednesday in weekly recurrence mode", function() {
            let wednesdayMoment = moment().isoWeekday("Wednesday");

            expect(Utils.getNextDeliverDate("weekly", {
                startDate: wednesdayMoment.toISOString()
            })).to.be.equal(
                wednesdayMoment.endOf("isoWeek").minute(0).hour(12).toISOString()
            );
        });

        it("should get the third sunday from friday in biweekly recurrence mode", function() {
            let fridayMoment = moment().isoWeekday("Friday");

            expect(Utils.getNextDeliverDate("biweekly", {
                startDate: fridayMoment.toISOString()
            })).to.be.equal(
                fridayMoment.endOf("isoWeek").add(2,"weeks").minute(0).hour(12).toISOString()
            );
        });

        it("should get the second sunday from wednesday in biweekly recurrence mode", function() {
            let wednesdayMoment = moment().isoWeekday("Wednesday");

            expect(Utils.getNextDeliverDate("biweekly", {
                startDate: wednesdayMoment.toISOString()
            })).to.be.equal(
                wednesdayMoment.endOf("isoWeek").add(1,"week").minute(0).hour(12).toISOString()
            );
        });

        it("should get the next sunday from sunday in weekly recurrence mode", function() {
            let sundayMoment = moment().isoWeekday("Sunday");

            expect(Utils.getNextDeliverDate("weekly", {
                startDate: sundayMoment.toISOString()
            })).to.be.equal(
                sundayMoment.endOf("isoWeek").add(1,"week").minute(0).hour(12).toISOString()
            );
        });
    });
});
