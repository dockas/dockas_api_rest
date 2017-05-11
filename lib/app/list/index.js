let express     = require("express"),
    authPol     = require("policies/auth"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", authPol, Ctrl.find);
    router.post("/", authPol, Ctrl.create);

    router.put("/:id", authPol, Ctrl.update);
    router.delete("/:id", authPol, Ctrl.remove);

    return router;
};
