let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
    priceValue: Joi.number(),
    currency: Joi.string(),
    currencyCode: Joi.string(),
    stock: Joi.number().integer(),
    image: Joi.string()
});
