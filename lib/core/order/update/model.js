let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    billingOrder: Joi.string().empty(null),
    billingCharge: Joi.string().empty(null)
});

module.exports.UpdateStatusSchema = Joi.object().keys({
    status: Joi.string().only([
        Types.Status.PAYMENT_PENDING,
        Types.Status.PAYMENT_AUTHORIZED,
        Types.Status.PACKAGED,
        Types.Status.DELIVERING,
        Types.Status.DELIVERED
    ]).empty(null).required()
});