let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    name: Joi.string(),
    nameId: Joi.string().regex(/^[a-z0-9-]+$/).empty(null),
    description: Joi.string(),
    owners: Joi.array().items(Joi.string()),
    brand: Joi.string(),
    priceValue: Joi.number(),
    currencySymbol: Joi.string(),
    currencyCode: Joi.string(),
    stock: Joi.number().integer(),
    mainImage: Joi.string(),
    images: Joi.array().items(Joi.string()).min(1)
});
