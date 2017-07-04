let config      = require("common-config"),
    Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),

    brands: Joi.array().items(Joi.string()).empty(null).default([]),
    lists: Joi.array().items(Joi.string()).empty(null).default([]),
    listSubscriptions: Joi.array().items(Joi.string()).empty(null).default([]),

    active: Joi.bool().empty(null).default(false),

    roles: Joi.array().items(Joi.string().only([
        Types.Role.USER,
        Types.Role.ADMIN,
        Types.Role.SELLER
    ])).empty(null).default([Types.Role.USER]),

    document: Joi.object().keys({
        type: Joi.string().only(["cpf"]).required(),
        number: Joi.string().required()
    }),

    postalCodeAddress: Joi.object().keys({
        neighborhood: Joi.string().required(),
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
        postalCode: Joi.string().required()
    }),

    phones: Joi.array().items(Joi.object().keys({
        countryCode: Joi.string().empty(null).default("55"),
        areaCode: Joi.string().required(),
        number: Joi.string().required()
    })).default([]),
    
    addresses: Joi.array().items(Joi.string()).empty(null).default([]),

    brandCount: Joi.number().integer().empty(null).default(0),
    maxBrandCount: Joi.number().integer().empty(null).default(config.user.maxBrandCount),

    billingSources: Joi.array().empty(null).default([]),

    wallet: Joi.string(),

    __version: Joi.string().forbidden().default(1)
});
