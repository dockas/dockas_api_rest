let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    fullName: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(6),

    roles: Joi.array().items(Joi.string().only([
        Types.ROLE_USER,
        Types.ROLE_ADMIN,
        Types.ROLE_SELLER
    ]))
});

module.exports.AddressSchema = Joi.object().keys({
    label: Joi.string(),
    address: Joi.string(),
    number: Joi.string(),
    complement: Joi.string(),
    postal_code: Joi.string(),
    neighborhood: Joi.string(),
    city: Joi.string()
});