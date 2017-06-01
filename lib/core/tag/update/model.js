let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    name: Joi.string(),
    nameId: Joi.string(),
    categories: Joi.array().items(Joi.string()),
    color: Joi.string()
});
