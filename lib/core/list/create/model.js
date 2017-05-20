let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    users: Joi.array().items(Joi.string()).min(1),
    name: Joi.string().required(),
    nameId: Joi.string(),
    items: Joi.array().items(Joi.object().keys({
        product: Joi.string().required(),
        count: Joi.number().integer().required()
    })).min(1),
    recurrence: Joi.string(),

    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
