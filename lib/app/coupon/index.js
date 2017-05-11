let express     = require("express"),
    authPol     = require("policies/auth"),
    adminPol    = require("policies/admin"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", authPol, Ctrl.find);
    router.post("/", authPol, adminPol, Ctrl.create);

    router.post("/nameId/:id", authPol, Ctrl.applyByNameId);
    router.get("/nameId/:id", authPol, Ctrl.findByNameId);

    router.post("/:id", authPol, Ctrl.apply);
    router.put("/:id", authPol, adminPol, Ctrl.update);
    router.delete("/:id", authPol, adminPol, Ctrl.remove);

    return router;
};
