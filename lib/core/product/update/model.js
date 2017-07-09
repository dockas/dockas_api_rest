let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    name: Joi.string(),
    nameId: Joi.string().regex(/^[a-z0-9-]+$/).empty(null),
    description: Joi.string(),
    priority: Joi.number().integer().empty(null),
    brand: Joi.string(),
    priceValue: Joi.number().integer(),
    costValue: Joi.number().integer(),
    currencySymbol: Joi.string(),
    currencyCode: Joi.string(),
    category: Joi.string(),
    status: Joi.string().only([
        Types.STATUS_NOT_APPROVED,
        Types.STATUS_PUBLIC,
        Types.STATUS_PRIVATE
    ]).empty(null),
    selectedTags: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string()),
    hash: Joi.string(),
    stock: Joi.number().integer(),
    mainProfileImage: Joi.string(),
    profileImages: Joi.array().items(Joi.string()).min(1),
    images: Joi.array().items(Joi.string()),
    validityDate: Joi.date().iso().empty(null)
});
