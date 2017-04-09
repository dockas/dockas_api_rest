let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});
