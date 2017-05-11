let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    users: Joi.array().items(Joi.string()),
    name: Joi.string(),
    nameId: Joi.string(),
    items: Joi.array().items(Joi.object().keys({
        product: Joi.string().required(),
        count: Joi.number().integer().required()
    })).min(1),
    recurrence: Joi.string()
});
