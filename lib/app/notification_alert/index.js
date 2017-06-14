let express     = require("express"),
    authPol     = require("policies/auth"),
    adminPol    = require("policies/admin"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", authPol, Ctrl.find);
    router.post("/", authPol, adminPol, Ctrl.create);

    router.put("/:id", authPol, Ctrl.update);
    router.delete("/:id", authPol, adminPol, Ctrl.remove);

    router.get("/count", authPol, Ctrl.count);


    return router;
};
