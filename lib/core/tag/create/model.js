let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    _key: Joi.strip(),
    creator: Joi.string().required(),
    name: Joi.string().required(),
    nameId: Joi.string().required(),
    priority: Joi.number().integer(),
    categories: Joi.array().items(Joi.string()).empty(null),
    color: Joi.string().empty(null),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
