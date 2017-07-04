let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    user: Joi.string().required(),
    totalPrice: Joi.number().integer().required(),
    grossTotalPrice: Joi.number().integer().required(),
    totalFee: Joi.number().integer().empty(null).default(0),
    totalDiscount: Joi.number().integer().empty(null).default(0),
    currency: Joi.string().empty(null).default("R$"),
    currencyCode: Joi.string().empty(null).default("BRL"),

    fees: Joi.array().items(Joi.object().keys({
        value: Joi.number().integer().required(),
        type: Joi.string().only([
            Types.FeeType.DELIVER
        ]).required()
    })).empty(null).default([]),

    list: Joi.string(),
    listSubscription: Joi.string(),

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

    items: Joi.array().items(Joi.object().keys({
        product: Joi.string().required(),
        priceValue: Joi.number().integer().required(),
        currency: Joi.string().default("R$"),
        currencyCode: Joi.string().default("BRL"),
        quantity: Joi.number().integer().required(),
        stockedQuantity: Joi.number().integer().empty(null).default(0),

        // When item status pass to reserved, then we must
        // generate an income to the brand wallet that includes
        status: Joi.string().only([
            Types.ItemStatus.PENDING,
            Types.ItemStatus.READY,
            Types.ItemStatus.STOCKED,
            Types.ItemStatus.PACKAGED
        ]).default(Types.ItemStatus.PENDING)
    })).min(1),

    // Brands of items present in this order (for fast
    // search).
    brands: Joi.array().items(Joi.string()).default([]),

    // Companies of items present in this order (for fast
    // search).
    companies: Joi.array().items(Joi.string()).default([]),

    // Hero : user that going to deliver this order.
    hero: Joi.string(),

    // Order status
    status: Joi.string().only([
        Types.Status.UNAPPROVED,
        Types.Status.PAYMENT_PENDING,
        Types.Status.PAYMENT_AUTHORIZED,
        Types.Status.PACKAGED,
        Types.Status.DELIVERING,
        Types.Status.DELIVERED
    ]).empty(null).default(Types.Status.PAYMENT_PENDING),

    coupons: Joi.array().items(Joi.string()).empty(null),

    // Date to deliver this order.
    deliverDate: Joi.date().iso().empty(null).required(),

    // Payment type
    paymentType: Joi.string().only([
        Types.PaymentType.DEFAULT,
        Types.PaymentType.ON_DELIVER
    ]).empty(null).default(Types.PaymentType.DEFAULT),

    // Other relevant dates
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
