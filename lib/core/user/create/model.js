let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),

    role: Joi.string().empty(null).default(Types.ROLE_USER).only([
        Types.ROLE_USER,
        Types.ROLE_ADMIN
    ])
});
