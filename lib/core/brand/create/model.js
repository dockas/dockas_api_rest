let Joi         = require("joi"),
    config      = require("common-config"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string(),  // The creator is the main owner.
    owners: Joi.array().items(Joi.object().keys({
        user: Joi.string().required(),
        status: Joi.string().only([
            Types.OwnerStatus.APPROVED,
            Types.OwnerStatus.MAX_BRAND_COUNT_REACHED
        ]).default(Types.OwnerStatus.APPROVED),
        role: Joi.string().only([
            Types.OwnerRole.ADMIN
        ]).default(Types.OwnerRole.ADMIN)
    })),
    company: Joi.string(),
    name: Joi.string().required(),
    nameId: Joi.string(),
    description: Joi.string(),
    status: Joi.string().only([
        Types.Status.NOT_APPROVED,
        Types.Status.PUBLIC,
        Types.Status.PRIVATE
    ]).empty(null).default(Types.Status.NOT_APPROVED),
    bannerImage: Joi.string(),
    mainProfileImage: Joi.string(),
    profileImages: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string()),
    productCount: Joi.number().integer().empty(null).default(0),
    maxProductCount: Joi.number().integer().empty(null).default(config.brand.maxProductCount),
    wallet: Joi.string(),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
