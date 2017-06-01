let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    name: Joi.string(),
    nameId: Joi.string(),
    color: Joi.string()
});
