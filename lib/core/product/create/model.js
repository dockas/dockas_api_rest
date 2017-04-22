let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    priceValue: Joi.number().required(),
    currency: Joi.string().empty(null).default("R$"),
    currencyCode: Joi.string().empty(null).default("BRL"),
    tags: Joi.array().items(Joi.string()).min(1).empty(null),
    stock: Joi.number().integer().empty(null),
    image: Joi.string().required(),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null)
});
