let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    summary: Joi.string(),
    description: Joi.string(),
    price: Joi.number(),
    stock: Joi.number().integer(),
    image: Joi.string()
});
