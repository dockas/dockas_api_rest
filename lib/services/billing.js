let Mongo   = require("common-utils/lib/mongo"),
    Core    = require("core/billing");

class Srv {
    static connect() {
        return (Core.setupCollection ? 
            Core.setupCollection(Mongo.db) :
            Promise.resolve()
        ).then(() => {
            Srv.client = new Core({mode: process.env.NODE_ENV});
        });
    }
}

Srv.types = require("core/billing/types");

module.exports = Srv;