let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    fullName: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(6),

    brands: Joi.array().items(Joi.string()),
    lists: Joi.array().items(Joi.string()),

    billingCustomer: Joi.string(),

    document: Joi.object().keys({
        type: Joi.string().only(["cpf"]).required(),
        number: Joi.string().required()
    }),

    roles: Joi.array().items(Joi.string().only([
        Types.ROLE_USER,
        Types.ROLE_ADMIN,
        Types.ROLE_SELLER
    ]))
});

module.exports.AddSchema = Joi.object().keys({
    addresses: Joi.array().items(Joi.object().keys({
        _id: Joi.string(),
        label: Joi.string(),
        address: Joi.string(),
        number: Joi.string(),
        complement: Joi.string(),
        postal_code: Joi.string(),
        neighborhood: Joi.string(),
        city: Joi.string(),
        phone: Joi.object().keys({
            countryCode: Joi.string().empty(null).default("55"),
            areaCode: Joi.string().required(),
            number: Joi.string().required()
        })
    })),
    phones: Joi.array().items(Joi.object().keys({
        countryCode: Joi.string().empty(null).default("55"),
        areaCode: Joi.string().required(),
        number: Joi.string().required()
    })),
    lists: Joi.array().items(Joi.string()),
    brands: Joi.array().items(Joi.string())
});

module.exports.RemoveSchema = Joi.object().keys({
    addresses: Joi.array().items(Joi.string()),
    phones: Joi.array().items(Joi.string()),
    lists: Joi.array().items(Joi.string()),
    brands: Joi.array().items(Joi.string())
});