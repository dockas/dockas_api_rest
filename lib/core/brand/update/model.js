let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    owners: Joi.array().items(Joi.string()),
    name: Joi.string(),
    nameId: Joi.string(),
    description: Joi.string(),
    status: Joi.string().only([
        Types.Status.NOT_APPROVED,
        Types.Status.PUBLIC,
        Types.Status.PRIVATE
    ]).empty(null),
    bannerImage: Joi.string(),
    mainProfileImage: Joi.string(),
    profileImages: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string()),
    productCount: Joi.number().integer()
});
