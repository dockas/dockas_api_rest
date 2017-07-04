let express             = require("express"),
    authPol             = require("policies/auth"),
    nonBlockAuthPol     = require("policies/nonBlockAuthPol"),
    userPol             = require("policies/user"),
    Ctrl                = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();
    let ctrl = new Ctrl();

    router.get("/", nonBlockAuthPol, ctrl.find);
    router.post("/", authPol, userPol, ctrl.create);

    router.put("/:id/item/:productId", authPol, ctrl.updateItem);

    router.get("/nameId/:id", ctrl.findByNameId);
    router.put("/:id", authPol, ctrl.update);
    router.delete("/:id", authPol, ctrl.remove);

    return router;
};
