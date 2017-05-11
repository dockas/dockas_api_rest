let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    selectedOption: Joi.string(),
    status: Joi.string().only([
        Types.STATUS_NEW,
        Types.STATUS_VIEWED,
        Types.STATUS_CLICKED
    ])
});
