let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    status: Joi.string().only([
        Types.STATUS_OPEN,
        Types.STATUS_CLOSED
    ])
});
