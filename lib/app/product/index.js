let express             = require("express"),
    authPol             = require("policies/auth"),
    adminPol            = require("policies/admin"),
    userPol             = require("policies/user"),
    approvedOwnerPol    = require("policies/product_approved_owner"),
    Ctrl                = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", Ctrl.find);
    router.post("/", authPol, userPol, Ctrl.create);
    router.post("/csv", authPol, adminPol, Ctrl.createFromCsv);

    router.get("/nameId/:id", Ctrl.findByNameId);

    router.put("/:id/price", authPol, approvedOwnerPol, Ctrl.updatePrice);
    router.put("/:id/status", authPol, adminPol, Ctrl.updateStatus);
    router.put("/:id", authPol, approvedOwnerPol, Ctrl.update);

    return router;
};
