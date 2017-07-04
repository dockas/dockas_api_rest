let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    // Wallet to which this transfer is applied to.
    wallet: Joi.string(),

    // Gross value of this transfer
    value: Joi.number().integer().default(0),

    // Fees
    fees: Joi.array().items(Joi.object().keys({
        type: Joi.string().only([
            Types.FeeType.PERCENTUAL,
            Types.FeeType.FIXED
        ]).required(),
        value: Joi.number().integer()
    })),

    // Net value of this transfer (i.e., gross value
    // without the fees).
    netValue: Joi.number().integer().default(0),

    // Currency code of the value.
    currencyCode: Joi.string().default("BRL")
});
