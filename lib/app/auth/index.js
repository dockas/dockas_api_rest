let express     = require("express"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.post("/signin", Ctrl.signin);
    router.get("/signed", Ctrl.signed);
    router.post("/signout", Ctrl.signout);

    return router;
};
