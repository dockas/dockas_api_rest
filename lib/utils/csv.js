module.exports = class CSV {
    static toJson(csvStr) {
        let jsons = [];

        // Convert csvStr to json.
        let lines = csvStr.split("\r\n");
        let headersLine = lines.shift();
        let headers = headersLine.split(",");

        for(let line of lines) {
            line = line.split(",");
            let json = {};

            for(let i in headers) {
                let data = line[i];

                if(headers[i] == "tags") {
                    data = data.split(";").map((tag) => {
                        return tag.replace(/^ +/, "").replace(/ +$/, "");
                    });
                }

                json[headers[i]] = data;
            }

            jsons.push(json);
        }

        return jsons;
    }
};