let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string().required(),
    brand: Joi.string().empty(null),
    name: Joi.string().required(),
    priority: Joi.number().integer().empty(null).default(0),
    description: Joi.string().empty(null).empty(""),
    priceValue: Joi.number().required(),
    priceUnity: Joi.string().empty(null).default("item"),
    priceGroups: Joi.array().items(Joi.object().keys({
        count: Joi.number().required(),
        unity: Joi.string().required()
    })).empty(null),
    currencySymbol: Joi.string().empty(null).default("R$"),
    currencyCode: Joi.string().empty(null).default("BRL"),
    tags: Joi.array().items(Joi.string()).min(1).empty(null),
    stock: Joi.number().integer().empty(null),
    mainProfileImage: Joi.string().empty(null),
    profileImages: Joi.array().items(Joi.string()).empty(null).default([]),
    images: Joi.array().items(Joi.string()).empty(null).default([]),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
