let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    value: Joi.number().integer().default(0),
    fees: Joi.array().items(Joi.object().keys({
        type: Joi.string().only([
            Types.FeeType.PERCENTUAL,
            Types.FeeType.FIXED
        ]).required(),
        value: Joi.number().integer()
    })),
    netValue: Joi.number().integer().default(0),
    currencyCode: Joi.string().default("BRL")
});
