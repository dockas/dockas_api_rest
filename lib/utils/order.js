let lodash          = require("lodash"),
    moment          = require("moment"),
    LoggerFactory   = require("common-logger"),
    config          = require("common-config");

let Logger = new LoggerFactory("utils.order");

module.exports = class OrderUtils {
    static getTotalFee(order) {
        let logger = Logger.create("getTotalFee");
        logger.info("enter", order);

        let {deliverDate,grossTotalPrice} = order;
        let fees = lodash.get(config, "order.fees")||{};
        let appliedFees = [];
        let totalFee = 0;

        // Deliver fee
        let {priceRange,weekdays} = lodash.get(fees, "deliver.rules")||{};

        logger.info("data", {priceRange, weekdays, fees});

        let priceRangePass = (priceRange
            && grossTotalPrice < (priceRange.lt||(grossTotalPrice+1))
            && grossTotalPrice <= (priceRange.lte||grossTotalPrice)
            && grossTotalPrice >= (priceRange.gte||grossTotalPrice)
            && grossTotalPrice > (priceRange.gt||(grossTotalPrice-1)));

        let weekdaysPass = (weekdays 
            && deliverDate
            && weekdays.indexOf(moment.weekdays(moment(deliverDate).isoWeekday())) >= 0);

        logger.info("deliver pass result", {priceRangePass, weekdaysPass});

        // Apply on pass
        if(priceRangePass || weekdaysPass) {
            totalFee += lodash.get(fees, "deliver.value")||0;
            
            appliedFees.push({
                value: lodash.get(fees, "deliver.value")||0,
                type: "deliver"
            });
        }

        return {appliedFees, totalFee};
    }
};