let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    users: Joi.array().items(Joi.string()),
    type: Joi.string().required(),
    message: Joi.string(),
    data: Joi.object(),
    options: Joi.array().items(Joi.object().keys({
        label: Joi.string(),
        value: Joi.string()
    })).empty(null),
    onOptionSelectedAction: Joi.string(),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
