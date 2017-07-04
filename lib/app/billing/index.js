let express     = require("express"),
    authPol     = require("policies/auth"),
    userPol     = require("policies/user"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    // Credit card endpoints
    router.post("/source", authPol, userPol, Ctrl.sourceAdd);
    router.delete("/source/:id", authPol, userPol, Ctrl.sourceRemove);

    return router;
};
