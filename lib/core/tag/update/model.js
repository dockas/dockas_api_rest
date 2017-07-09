let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    name: Joi.string(),
    nameId: Joi.string(),
    color: Joi.string(),
    priority: Joi.number().integer(),
    categories: Joi.array().items(Joi.string())
});
