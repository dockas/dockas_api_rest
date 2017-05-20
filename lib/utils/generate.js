let lodash              = require("lodash"),
    LoggerFactory       = require("common-logger");

let Logger = new LoggerFactory("generate");

module.exports = class Generate {
    static async name({
        name=null,
        nameKey=null,
        collection=null,
        nameValue=null
    }) {
        let records,
            logger = Logger.create("name");

        // Set nameValue
        nameValue = nameValue || lodash.kebabCase(name);

        logger.info("enter", {name,nameKey,nameValue});

        try {
            records = await collection.find({
                [nameKey]: new RegExp(nameValue, "gi")
            }, {[nameKey]: 1}).toArray();
        }
        catch(error) {
            logger.error("collection find error", error);
            throw error;
        }

        logger.debug("find names success", {records});

        // Iterate over users to get available nameId.
        let count = 0;
        let unavailableNames = lodash.reduce(records, (map, record) => {
            map[record[nameKey]] = 1;
            return map;
        }, {});

        logger.debug("unavailableNames", unavailableNames);

        while(count < 10000000) {
            let inc = count > 0 ? `-${count}` : "";
            let tryNameValue = `${nameValue}${inc}`;

            logger.debug(`check nameValue = ${tryNameValue}`);

            if(!unavailableNames[tryNameValue]) {
                logger.debug(`nameValue "${tryNameValue}" is available`);
                return tryNameValue;
            }

            count++;
        }

        throw(new Error("could not generate name"));
    }
};