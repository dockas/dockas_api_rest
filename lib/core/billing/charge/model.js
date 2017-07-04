let Joi         = require("joi");

module.exports.Schema = Joi.object().keys({
    // Customer that owns the charge
    customer: Joi.string().required(),

    // Payment source for the charge
    source: Joi.object().keys({
        method: Joi.string().only([
            "credit_card",
            "bank_slip"
        ]).required(),
        _id: Joi.alternatives().when(
            Joi.ref("method"),
            {
                is: "credit_card", 
                then: Joi.string().required(), 
                otherwise: Joi.strip()
            }
        ),
        hash: Joi.alternatives().when(
            Joi.ref("method"),
            {
                is: "credit_card",
                then: Joi.string().required(), 
                otherwise: Joi.strip()
            }
        )
    }),

    // ID of the billing order this charge is for.
    order: Joi.string()
});
