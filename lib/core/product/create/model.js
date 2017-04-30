let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string().required(),
    owner: Joi.string(),
    name: Joi.string().required(),
    nameId: Joi.string().regex(/^[a-z0-9-]+$/).required(),
    description: Joi.string(),
    priceValue: Joi.number().required(),
    priceUnity: Joi.string().empty(null).default("item"),
    currency: Joi.string().empty(null).default("R$"),
    currencyCode: Joi.string().empty(null).default("BRL"),
    tags: Joi.array().items(Joi.string()).min(1).empty(null),
    stock: Joi.number().integer().empty(null),
    mainImage: Joi.string().required(),
    images: Joi.array().items(Joi.string()).min(1),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null)
});
