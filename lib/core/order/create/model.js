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
    })),

    status: Joi.string().empty(null).default(Types.STATUS_OPEN).only([
        Types.STATUS_OPEN,
        Types.STATUS_CLOSED
    ]),
    
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null)
});
