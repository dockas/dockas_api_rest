let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    selectedOption: Joi.string(),
    status: Joi.number().only([
        Types.Status.NEW,
        Types.Status.VIEWED,
        Types.Status.REMOVED
    ])
});
