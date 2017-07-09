let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    billingOrder: Joi.string().empty(null),
    billingCharge: Joi.string().empty(null),
    hero: Joi.string().empty(null),

    // Order events
    events: Joi.array().items(Joi.object().keys({
        name: Joi.string().required(),
        receivedAt: Joi.date().iso()
    }))
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

module.exports.UpdateItemStatusSchema = Joi.object().keys({
    status: Joi.string().only([
        Types.ItemStatus.PENDING,
        Types.ItemStatus.READY,
        Types.ItemStatus.STOCKED,
        Types.ItemStatus.PACKAGED
    ]).empty(null).required()
});