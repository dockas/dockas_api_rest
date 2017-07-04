let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    customer: Joi.string().required(),

    method: Joi.string().only([
        "credit_card"
    ]),
    
    data: Joi.alternatives().when(
        Joi.ref("method"),
        {
            is: "credit_card", 
            then: Joi.object().keys({
                expMonth: Joi.number().integer().min(1).max(12).required(),
                expYear: Joi.number().integer().required(),
                number: Joi.string().required(),
                cvc: Joi.number().integer(),
                holder: Joi.object().keys({
                    fullname: Joi.string().required(),
                    birthdate: Joi.date().iso().required(),
                    phone: Joi.object().keys({
                        countryCode: Joi.string().empty(null).default("55"),
                        areaCode: Joi.string().required(),
                        number: Joi.string().required()
                    }),
                    document: Joi.object().keys({
                        type: Joi.string().only(["cpf"]).required(),
                        number: Joi.string().required()
                    })
                })
            }).required()
        }
    )
});
