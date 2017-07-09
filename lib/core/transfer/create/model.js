let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    // Wallet to which this transfer is applied to.
    wallet: Joi.string(),

    // Gross value of this transfer
    grossValue: Joi.number().integer().default(0),

    // Fees
    fees: Joi.array().items(Joi.object().keys({
        id: Joi.string().required(),
        type: Joi.string().only([
            Types.FeeType.PERCENTUAL,
            Types.FeeType.FIXED
        ]).required(),
        value: Joi.number().integer()
    })),

    // Net value of this transfer (i.e., gross value
    // without the fees).
    value: Joi.number().integer().default(0),

    // Currency code of the value.
    currencyCode: Joi.string().default("BRL")
});
