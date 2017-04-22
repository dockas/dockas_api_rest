let express     = require("express"),
    authPol     = require("policies/auth"),
    adminPol    = require("policies/admin"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", Ctrl.find);
    router.post("/", authPol, adminPol, Ctrl.create);

    return router;
};
