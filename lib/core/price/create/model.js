let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string().required(),
    product: Joi.string().required(),
    value: Joi.number().required(),
    currency: Joi.string().empty(null).default("R$"),
    currencyCode: Joi.string().empty(null).default("BRL"),
    createdAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null)
});
