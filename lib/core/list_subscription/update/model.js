let Joi     = require("joi"),
    Types   = require("../types");

module.exports.Schema = Joi.object().keys({
    billingSource: Joi.object().keys({
        _id: Joi.string(),
        method: Joi.string(),
        lastDigits: Joi.string(),
        brand: Joi.string(),
        hash: Joi.string()
    }),
    
    address: Joi.object().keys({
        _id: Joi.string(),
        label: Joi.string(),
        street: Joi.string(),
        number: Joi.string(),
        complement: Joi.string(),
        postalCode: Joi.string(),
        neighborhood: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        country: Joi.string(),
        phone: Joi.object().keys({
            countryCode: Joi.string().empty(null).default("55"),
            areaCode: Joi.string().required(),
            number: Joi.string().required()
        })
    }),
    
    recurrence: Joi.string().only([
        Types.Recurrence.WEEKLY,
        Types.Recurrence.BIWEEKLY,
        Types.Recurrence.MONTHLY
    ]),

    nextDeliverDate: Joi.date().iso().empty(null)
});
