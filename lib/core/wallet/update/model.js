let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    billingAccount: Joi.string(),
    balance: Joi.number(),
    credit: Joi.number(),
    currencyCode: Joi.string()
});
