let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    fullName: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(6),

    brands: Joi.array().items(Joi.string()),
    lists: Joi.array().items(Joi.string()),

    roles: Joi.array().items(Joi.string().only([
        Types.ROLE_USER,
        Types.ROLE_ADMIN,
        Types.ROLE_SELLER
    ]))
});

module.exports.AddSchema = Joi.object().keys({
    addresses: Joi.array().items(Joi.object().keys({
        id: Joi.string(),
        label: Joi.string(),
        address: Joi.string(),
        number: Joi.string(),
        complement: Joi.string(),
        postal_code: Joi.string(),
        neighborhood: Joi.string(),
        city: Joi.string()
    })),
    lists: Joi.array().items(Joi.string()),
    brands: Joi.array().items(Joi.string())
});

module.exports.RemoveSchema = Joi.object().keys({
    addresses: Joi.array().items(Joi.string()),
    lists: Joi.array().items(Joi.string()),
    brands: Joi.array().items(Joi.string())
});