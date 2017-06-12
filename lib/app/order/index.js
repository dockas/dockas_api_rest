let express     = require("express"),
    authPol     = require("policies/auth"),
    userPol     = require("policies/user"),
    adminPol    = require("policies/admin"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();
    let ctrl = new Ctrl();

    router.put("/:id/status", authPol, adminPol, ctrl.updateStatus);
    router.get("/:id/charge", authPol, ctrl.chargeFind);
    router.post("/:id/charge", authPol, userPol, ctrl.charge);

    router.get("/:id", authPol, ctrl.findById);
    router.get("/", authPol, ctrl.find);    
    router.post("/", authPol, userPol, ctrl.create);

    return router;
};