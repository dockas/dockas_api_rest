let express     = require("express"),
    authPol     = require("policies/auth"),
    adminPol    = require("policies/admin"),
    userPol     = require("policies/user"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", Ctrl.find);
    router.post("/", authPol, userPol, Ctrl.create);

    router.post("/csv", authPol, adminPol, Ctrl.createFromCsv);

    router.get("/nameId/:id", Ctrl.findByNameId);

    router.put("/:id", authPol, userPol, Ctrl.update);
    router.delete("/:id", authPol, adminPol, Ctrl.remove);

    return router;
};
