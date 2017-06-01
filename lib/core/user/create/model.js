let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),

    brands: Joi.array().items(Joi.string()).empty(null).default([]),
    lists: Joi.array().items(Joi.string()).empty(null).default([]),

    roles: Joi.array().items(Joi.string().only([
        Types.ROLE_USER,
        Types.ROLE_ADMIN,
        Types.ROLE_SELLER
    ])).empty(null).default([Types.ROLE_USER]),

    document: Joi.object().keys({
        type: Joi.string().only(["cpf"]).required(),
        number: Joi.string().required()
    }),

    __version: Joi.string().forbidden().default(1)
});
