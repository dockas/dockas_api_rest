let express     = require("express"),
    authPol     = require("policies/auth"),
    adminPol    = require("policies/admin"),
    Ctrl        = require("./controller");

function keyToId(req,res,next) {
    req.params.id = `tags/${req.params.id}`;
    next();
}

module.exports = function() {
    // Setup the router.
    let router = new express.Router();

    router.get("/", Ctrl.find);
    router.post("/", authPol, adminPol, Ctrl.create);

    router.post("/csv", authPol, adminPol, Ctrl.createFromCsv);

    router.put("/:id/find/count", Ctrl.incFindCount);
    router.put("/:id", keyToId, authPol, adminPol, Ctrl.update);

    return router;
};
