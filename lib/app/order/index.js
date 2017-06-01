let express     = require("express"),
    authPol     = require("policies/auth"),
    userPol     = require("policies/user"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.put("/:id/status", authPol, userPol, Ctrl.updateStatus);
    router.get("/:id/charge", authPol, Ctrl.chargeFind);
    router.post("/:id/charge", authPol, userPol, Ctrl.charge);

    router.get("/:id", authPol, Ctrl.findById);
    router.get("/", authPol, Ctrl.find);    
    router.post("/", authPol, userPol, Ctrl.create);

    return router;
};
