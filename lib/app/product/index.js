let express             = require("express"),
    authPol             = require("policies/auth"),
    adminPol            = require("policies/admin"),
    userPol             = require("policies/user"),
    approvedOwnerPol    = require("policies/product_approved_owner"),
    Ctrl                = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();
    let ctrl = new Ctrl();

    router.get("/", ctrl.find);
    router.post("/", authPol, userPol, ctrl.create);
    router.post("/csv", authPol, adminPol, ctrl.createFromCsv);

    router.get("/nameId/:id", ctrl.findByNameId);

    router.put("/:id/price", authPol, approvedOwnerPol, ctrl.updatePrice);
    router.put("/:id/cost", authPol, approvedOwnerPol, ctrl.updateCost);
    router.put("/:id/status", authPol, adminPol, ctrl.updateStatus);
    router.put("/:id", authPol, approvedOwnerPol, ctrl.update);

    return router;
};
