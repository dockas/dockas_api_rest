let Joi         = require("joi"),
    config      = require("common-config"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string(),  // The creator is the main owner.
    owners: Joi.array().items(Joi.object().keys({
        user: Joi.string().required(),
        status: Joi.string().only([
            Types.OWNER_STATUS_APPROVED,
            Types.OWNER_STATUS_MAX_BRAND_COUNT_REACHED
        ]).default(Types.OWNER_STATUS_APPROVED),
        role: Joi.string().only([
            Types.OWNER_ROLE_ADMIN
        ]).default(Types.OWNER_ROLE_ADMIN)
    })),
    company: Joi.string(),
    name: Joi.string().required(),
    nameId: Joi.string(),
    description: Joi.string(),
    status: Joi.string().only([
        Types.STATUS_NOT_APPROVED,
        Types.STATUS_PUBLIC,
        Types.STATUS_PRIVATE
    ]).empty(null).default(Types.STATUS_NOT_APPROVED),
    bannerImage: Joi.string(),
    mainProfileImage: Joi.string(),
    profileImages: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string()),
    productCount: Joi.number().integer().empty(null).default(0),
    maxProductCount: Joi.number().integer().empty(null).default(config.brand.maxProductCount),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
