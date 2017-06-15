let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    user: Joi.string().required(),
    totalPrice: Joi.number().integer().required(),
    currency: Joi.string().empty(null).default("R$"),
    currencyCode: Joi.string().empty(null).default("BRL"),

    address: Joi.object().keys({
        _id: Joi.string(),
        label: Joi.string(),
        street: Joi.string(),
        number: Joi.string(),
        complement: Joi.string(),
        postalCode: Joi.string(),
        neighborhood: Joi.string(),
        city: Joi.string(),
        phone: Joi.object().keys({
            countryCode: Joi.string().empty(null).default("55"),
            areaCode: Joi.string().required(),
            number: Joi.string().required()
        })
    }),

    items: Joi.array().items(Joi.object().keys({
        product: Joi.string().required(),
        priceValue: Joi.number().integer().required(),
        currency: Joi.string().default("R$"),
        currencyCode: Joi.string().default("BRL"),
        quantity: Joi.number().integer().required()
    })).min(1),

    status: Joi.string().only([
        Types.Status.PAYMENT_PENDING,
        Types.Status.PAYMENT_AUTHORIZED,
        Types.Status.PACKAGED,
        Types.Status.DELIVERING,
        Types.Status.DELIVERED
    ]).empty(null).default(Types.Status.PAYMENT_PENDING),

    coupons: Joi.array().items(Joi.string()).empty(null),
    
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
