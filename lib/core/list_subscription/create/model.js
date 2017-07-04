let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    user: Joi.string().required(),
    list: Joi.string().required(),

    billingSource: Joi.object().keys({
        _id: Joi.string().required(),
        method: Joi.string().required(),
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
    ]).empty(null).default(Types.Recurrence.WEEKLY),

    status: Joi.string().only([
        Types.Status.ACTIVE,
        Types.Status.INACTIVE
    ]).empty(null).default(Types.Status.ACTIVE),

    nextDeliverDate: Joi.date().iso().empty(null).required(),

    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
