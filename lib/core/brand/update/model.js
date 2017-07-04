let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    owners: Joi.array().items(Joi.string()),
    name: Joi.string(),
    nameId: Joi.string(),
    description: Joi.string(),
    status: Joi.string().only([
        Types.STATUS_NOT_APPROVED,
        Types.STATUS_PUBLIC,
        Types.STATUS_PRIVATE
    ]).empty(null),
    bannerImage: Joi.string(),
    mainProfileImage: Joi.string(),
    profileImages: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string()),
    productCount: Joi.number().integer()
});
