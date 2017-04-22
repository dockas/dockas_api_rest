let express     = require("express"),
    authPol     = require("policies/auth"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", Ctrl.find);
    router.post("/signup", Ctrl.signup);
    router.get("/me", authPol, Ctrl.findMe);
    router.put("/me", authPol, Ctrl.update);

    // Address
    router.post("/me/address", authPol, Ctrl.addAddress);
    router.delete("/me/address/:id", authPol, Ctrl.removeAddress);

    return router;
};
