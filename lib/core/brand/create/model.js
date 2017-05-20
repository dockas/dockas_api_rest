let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    owners: Joi.array().items(Joi.string()),
    company: Joi.string(),
    name: Joi.string().required(),
    nameId: Joi.string(),
    bannerImage: Joi.string(),
    mainProfileImage: Joi.array().items(Joi.string()),
    profileImages: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string()),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
