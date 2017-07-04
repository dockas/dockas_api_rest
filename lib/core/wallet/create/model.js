let Joi         = require("joi");
    //config      = require("common-config"),
    //Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    users: Joi.array().items(Joi.string()),

    // Account identification assotiated with this wallet
    // in billing gateway provider (for example, the 
    // account id in Moip gateway). This info is only
    // necessary if the wallet is supposed to allow 
    // withdrawal to a real bank account.
    billingAccount: Joi.string(),

    // This is the ballance of the billing account assotiated
    // with this wallet. Balance is real money and can be
    // transfered to user bank account through billing service.
    balance: Joi.number().integer().default(0),

    // Credit are virtual money that can be used only within
    // the platform (balance amount can be used as well).
    credit: Joi.number().integer().default(0),

    // Currency code of the balance and credit.
    currencyCode: Joi.string().default("BRL")
});
