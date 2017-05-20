let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    name: Joi.string(),
    nameId: Joi.string().regex(/^[a-z0-9-]+$/).empty(null),
    description: Joi.string(),
    priority: Joi.number().integer().empty(null),
    brand: Joi.string(),
    priceValue: Joi.number(),
    currencySymbol: Joi.string(),
    currencyCode: Joi.string(),
    stock: Joi.number().integer(),
    mainProfileImage: Joi.string(),
    profileImages: Joi.array().items(Joi.string()).min(1),
    images: Joi.array().items(Joi.string())
});
