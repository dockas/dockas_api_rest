let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),

    // Human friendly id for this coupon.
    nameId: Joi.string(),

    // Description of the coupon
    description: Joi.string(),

    // Max number of users that can apply this coupon
    maxApplyCount: Joi.number().integer().empty(null).default(1),

    // Users that can apply this coupon
    users: Joi.array().items(Joi.string()),

    // Products affected to this coupon.
    products: Joi.array().items(Joi.string()),

    // Brands affected to this coupon.
    brands: Joi.array().items(Joi.string()),

    // Users that had applied this coupon
    appliers: Joi.array().items(Joi.string()).empty(null).default([]),

    // Coupon value
    value: Joi.number().integer(),

    // Value type
    valueType: Joi.string().only([
        Types.VALUE_TYPE_PERCENTUAL,
        Types.VALUE_TYPE_MONETARY
    ]),

    // For VALUE_TYPE_MONETARY only.
    currencySymbol: Joi.string(),
    currencyCode: Joi.string(),

    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
