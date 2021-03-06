let Joi     = require("joi");

module.exports.Schema = Joi.object().keys({
    owners: Joi.array().items(Joi.string()),
    name: Joi.string(),
    nameId: Joi.string(),
    bannerImage: Joi.string(),
    mainProfileImage: Joi.array().items(Joi.string()),
    profileImages: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string())
});
