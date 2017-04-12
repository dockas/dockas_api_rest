let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string().required(),
    summary: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required(null),
    stock: Joi.number().integer().empty(null),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null)
});
