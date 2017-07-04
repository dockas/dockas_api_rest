let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    name: Joi.string().required(),
    nameId: Joi.string(),

    creator: Joi.string(),

    owners: Joi.array().items(Joi.object().keys({
        user: Joi.string().required()
    })).min(1),

    bannerImage: Joi.string(),

    items: Joi.array().items(Joi.object().keys({
        product: Joi.string().required(),
        quantity: Joi.number().integer().required()
    })).empty(null).default([]),

    // List priority in search
    priority: Joi.number().integer().empty(null).default(0),
    
    originalList: Joi.string(),

    // List description.
    description: Joi.string(),

    type: Joi.string().only([
        Types.Type.DEFAULT,
        Types.Type.RECIPE
    ]).empty(null).default(Types.Type.DEFAULT),

    status: Joi.string().only([
        Types.Status.PUBLIC,
        Types.Status.PRIVATE
    ]).empty(null).default(Types.Status.PRIVATE),

    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
