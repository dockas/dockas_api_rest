let moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    Types               = require("./types");

let Logger = new LoggerFactory("list.subscription.utils");

module.exports = class Utils {
    static getNextDeliverDate(subscription) {
        let nextDeliverDate,
            skip = 0,
            logger = Logger.create("getNextDeliverDate");

        logger.info("enter", {subscription});

        switch(subscription.recurrence) {
            case Types.Recurrence.WEEKLY: {skip = 1;break;}
            case Types.Recurrence.BIWEEKLY: {skip = 2;break;}
            case Types.Recurrence.MONTHLY: {skip = 4;break;}
        }

        // Set next deliver date
        nextDeliverDate = moment(subscription.nextDeliverDate).add(skip, "weeks");

        logger.debug("nextDeliverDate", {
            skip,
            next: nextDeliverDate.toISOString()
        });

        // Return the iso string.
        return nextDeliverDate.toISOString();
    }

    static getNextDeliverDate_2(recurrence, {
        startDate=moment().toISOString(),
        diff=3  // diff from sunday to wednesday is 3
    }={}) {
        let nextDeliverDate,
            logger = Logger.create("getNextDeliverDate");

        logger.info("enter", {recurrence,diff,startDate});

        // First sunday from which to count.
        let startMoment = moment(startDate);
        let nextSunday = startMoment.clone().endOf("isoWeek").minute(0).hour(12);

        logger.debug("start date", {
            nextSunday: nextSunday.toISOString(),
            start: startMoment.toISOString(),
            diff: nextSunday.diff(startMoment, "days")
        });

        // If next sunday is too close from startMoment, then
        // get the next one.
        if(nextSunday.diff(startMoment, "days") < diff) {
            nextSunday = nextSunday.add(1, "week");
        }

        logger.debug("next right sunday", {
            nextSunday: nextSunday.toISOString()
        });

        switch(recurrence) {
            case Types.Recurrence.WEEKLY: {
                nextDeliverDate = nextSunday;
                break;
            }

            case Types.Recurrence.BIWEEKLY: {
                nextDeliverDate = nextSunday.add(1, "week");
                break;
            }

            case Types.Recurrence.MONTHLY: {
                nextDeliverDate = nextSunday.add(3, "weeks");
                break;
            }
        }

        logger.debug("nextDeliverDate", {
            next: nextDeliverDate.toISOString()
        });

        // Return the iso string.
        return nextDeliverDate.toISOString();
    }

    /**
     * This function checks if nextDeliverDate is valid.
     */
    static isValidNextDeliverDate(nextDeliverDate) {
        let logger = Logger.create("isValidNextDeliverDate");
        logger.info("enter", {
            nextDeliverDate,
            minimumDaysToDeliver: config.minimumDaysToDeliver,
            allowedDeliverWeekdays: config.allowedDeliverWeekdays
        });

        //let todayMoment = moment();
        let minumumNextDeliverMoment = moment().add(config.order.minimumDaysToDeliver, "days");
        let nextDeliverMoment = moment(nextDeliverDate);
        let allowedDeliverWeekdays = lodash.map(config.order.allowedDeliverWeekdays, (obj, key) => {
            return moment().isoWeekday(key).isoWeekday();
        });

        logger.debug("data", {
            nextDeliverDate,
            minumumNextDeliverDate: minumumNextDeliverMoment.toISOString(),
            isValid: nextDeliverMoment.isValid(),
            isBeforeMinimum: nextDeliverMoment.isSameOrBefore(minumumNextDeliverMoment),
            allowedDeliverWeekdays,
            isAllowedWeekday: allowedDeliverWeekdays.indexOf(nextDeliverMoment.isoWeekday()) < 0
        });

        // Check if next deliver date respect the minimum dates to deliver.
        if(!nextDeliverMoment.isValid()
        || nextDeliverMoment.isSameOrBefore(minumumNextDeliverMoment)
        || allowedDeliverWeekdays.indexOf(nextDeliverMoment.isoWeekday()) < 0) {
            return false;
        }

        return true;
    }
};