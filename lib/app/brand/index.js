let express     = require("express"),
    authPol     = require("policies/auth"),
    adminPol    = require("policies/admin"),
    userPol     = require("policies/admin"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", authPol, Ctrl.find);
    router.post("/", authPol, adminPol, Ctrl.create);

    router.get("/nameId/:id", authPol, Ctrl.findByNameId);

    router.put("/:id", authPol, userPol, Ctrl.update);
    router.delete("/:id", authPol, adminPol, Ctrl.remove);

    return router;
};
