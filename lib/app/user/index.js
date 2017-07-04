let express     = require("express"),
    authPol     = require("policies/auth"),
    adminPol    = require("policies/admin"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.post("/signup", Ctrl.signup);
    router.get("/me", authPol, Ctrl.findMe);
    router.put("/me", authPol, Ctrl.updateMe);
    router.post("/me/address", authPol, Ctrl.addAddress);
    router.delete("/me/address/:id", authPol, Ctrl.removeAddress);

    router.put("/:id", authPol, adminPol, Ctrl.update);
    router.get("/", Ctrl.find);

    return router;
};
