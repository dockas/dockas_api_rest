let express     = require("express"),
    authPol     = require("policies/auth"),
    userPol     = require("policies/user"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.put("/:id/status", authPol, userPol, Ctrl.updateStatus);

    router.get("/", authPol, Ctrl.find);
    router.post("/", authPol, Ctrl.create);

    return router;
};
