let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string().required(),
    target: Joi.string().required(),
    value: Joi.number().integer().required(),
    unity: Joi.string().empty(null).default("item"),
    currencySymbol: Joi.string().empty(null).default("R$"),
    currencyCode: Joi.string().empty(null).default("BRL"),
    type: Joi.string().only([
        Types.PriceType.PRODUCT_PRICE,
        Types.PriceType.PRODUCT_COST
    ]).empty(null).default(Types.PriceType.PRODUCT_PRICE),
    createdAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null)
});
