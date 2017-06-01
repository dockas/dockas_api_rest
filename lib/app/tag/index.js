let express     = require("express"),
    authPol     = require("policies/auth"),
    adminPol    = require("policies/admin"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", Ctrl.find);
    router.post("/", authPol, adminPol, Ctrl.create);

    router.post("/csv", authPol, adminPol, Ctrl.createFromCsv);

    router.put("/:id", authPol, adminPol, Ctrl.update);

    return router;
};
