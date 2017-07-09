let express     = require("express"),
    authPol     = require("policies/auth"),
    userPol     = require("policies/user"),
    adminPol    = require("policies/admin"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();
    let ctrl = new Ctrl();

    router.put("/:id/status", authPol, userPol, ctrl.updateStatus);
    router.put("/:id", authPol, userPol, ctrl.update);
    router.get("/:id", authPol, ctrl.findById);
    router.get("/", authPol, userPol, ctrl.find);

    return router;
};