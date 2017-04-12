let Mongo   = require("common-utils/lib/mongo"),
    Core    = require("core/user");

class Srv {
    static connect() {
        return (Core.setupCollection ? 
            Core.setupCollection(Mongo.db) :
            Promise.resolve()
        ).then(() => {
            Srv.client = new Core();
        });
    }
}

Srv.types = require("core/user/types");

module.exports = Srv;