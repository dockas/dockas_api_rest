let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.string().required(),
    customer: Joi.string().required(),
    currency: Joi.string().empty(null).default("BRL"),
    items: Joi.array().items(Joi.object().keys({
        product: Joi.string().required(),
        price: Joi.number().integer().required(),
        currency: Joi.string().empty(null).default("BRL"),
        quantity: Joi.number().integer().required()
    })).min(1),
    totalFee: Joi.number().integer().default(0),
    totalDiscount: Joi.number().integer().default(0)
});
