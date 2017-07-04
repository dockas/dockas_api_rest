let express             = require("express"),
    authPol             = require("policies/auth"),
    userPol             = require("policies/user"),
    Ctrl                = require("./controller");

module.exports = function() {
    // Setup the router.
    let router = new express.Router();
    let ctrl = new Ctrl();

    router.get("/", authPol, ctrl.find);
    router.post("/", authPol, userPol, ctrl.create);

    router.put("/:id", authPol, ctrl.update);
    router.delete("/:id", authPol, ctrl.remove);

    return router;
};
