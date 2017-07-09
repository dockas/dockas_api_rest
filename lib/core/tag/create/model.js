let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    _key: Joi.strip(),
    creator: Joi.string().required(),
    name: Joi.string().required(),
    nameId: Joi.string(),
    priority: Joi.number().integer().empty(null).default(0),
    color: Joi.string().empty(null),
    findCount: Joi.number().integer().empty(null).default(0),
    categories: Joi.array().items(Joi.string()).default([]),
    productCount: Joi.number().integer().empty(null).default(0),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});

module.exports.CategoryEdgeSchema = Joi.object().keys({
    _from: Joi.string().required(),
    _to: Joi.string().required()
});
