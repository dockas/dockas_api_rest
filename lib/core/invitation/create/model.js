let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    email: Joi.string().email().required(),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null)
});
