let express     = require("express"),
    authPol     = require("policies/auth"),
    adminPol    = require("policies/admin"),
    userPol     = require("policies/user"),
    Ctrl        = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();
    let ctrl = new Ctrl();

    router.get("/", ctrl.find);
    router.post("/", authPol, userPol, ctrl.create);

    router.post("/csv", authPol, adminPol, ctrl.createFromCsv);

    router.get("/nameId/:id", ctrl.findByNameId);

    router.get("/:id/orders", authPol, userPol, ctrl.findOrders);
    router.get("/:id/transfers", authPol, userPol, ctrl.findTransfers);
    router.get("/:id/wallet", authPol, userPol, ctrl.findWallet);
    router.put("/:id", authPol, userPol, ctrl.update);
    router.delete("/:id", authPol, adminPol, ctrl.remove);

    return router;
};
