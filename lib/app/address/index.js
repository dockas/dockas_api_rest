let express     = require("express"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/postalCode/:code", Ctrl.findByPostalCode);

    return router;
};