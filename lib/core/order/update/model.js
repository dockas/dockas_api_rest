let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    billingOrder: Joi.string().empty(null),
    billingCharge: Joi.string().empty(null)
});

module.exports.UpdateStatusSchema = Joi.object().keys({
    status: Joi.string().only([
        Types.STATUS_OPEN,
        Types.STATUS_AWAITING_USER_AVAILABILITY,
        Types.STATUS_USER_AVAILABLE,
        Types.STATUS_USER_UNAVAILABLE,
        Types.STATUS_CONFIRMED,
        Types.STATUS_BOXED,
        Types.STATUS_DELIVERING,
        Types.STATUS_CLOSED
    ]).empty(null).default(Types.STATUS_OPEN)
});