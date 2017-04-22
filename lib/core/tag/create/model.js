let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string().required(),
    name: Joi.string().required(),
    color: Joi.string().empty(null),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null)
});
