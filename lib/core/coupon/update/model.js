let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),

    // Description of the coupon
    description: Joi.string(),

    // Max number of users that can apply this coupon
    maxApplyCount: Joi.number().integer().empty(null).default(1),

    // Users that can apply this coupon
    users: Joi.array().items(Joi.string())
});
