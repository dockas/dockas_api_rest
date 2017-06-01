let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    selectedOption: Joi.string(),
    status: Joi.number().integer()
});
