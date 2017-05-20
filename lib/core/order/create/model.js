let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    user: Joi.string().required(),
    totalPrice: Joi.number().required(),
    currency: Joi.string().empty(null).default("R$"),
    currencyCode: Joi.string().empty(null).default("BRL"),
    
    paypal: Joi.object().keys({
        id: Joi.string().required(),
        state: Joi.string().required(),
        paymentMethod: Joi.string(),
        allData: Joi.string()
    }),

    address: Joi.string(),

    items: Joi.array().items(Joi.object().keys({
        product: Joi.string().required(),
        priceValue: Joi.number().required(),
        currency: Joi.string().default("R$"),
        currencyCode: Joi.string().default("BRL"),
        count: Joi.number().integer().required()
    })).min(1),

    status: Joi.string().only([
        Types.STATUS_OPEN,
        Types.STATUS_AWAITING_USER_AVAILABILITY,
        Types.STATUS_USER_AVAILABLE,
        Types.STATUS_USER_UNAVAILABLE,
        Types.STATUS_CONFIRMED,
        Types.STATUS_BOXED,
        Types.STATUS_DELIVERING,
        Types.STATUS_CLOSED
    ]).empty(null).default(Types.STATUS_OPEN),

    coupons: Joi.array().items(Joi.string()).empty(null),
    
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
