let Arango  = require("utils/arango"),
    Core    = require("core/tag");

class Srv {
    static connect() {
        return (Core.setupCollection ? 
            Core.setupCollection(Arango.db) :
            Promise.resolve()
        ).then(() => {
            Srv.client = new Core({mode: process.env.NODE_ENV});
        });
    }
}

Srv.types = require("core/tag/types");

module.exports = Srv;