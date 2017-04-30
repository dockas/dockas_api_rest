let express     = require("express"),
    authPol     = require("policies/auth"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", authPol, Ctrl.find);
    router.post("/", Ctrl.create);

    router.get("/:id", Ctrl.findById);
    router.post("/:id", Ctrl.send);


    return router;
};
