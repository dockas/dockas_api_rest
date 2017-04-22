let express     = require("express"),
    authPol     = require("policies/auth"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", authPol, Ctrl.find);
    router.post("/", authPol, Ctrl.create);

    return router;
};
