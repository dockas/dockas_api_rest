let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.string(),
    product: Joi.string().required(),
    order: Joi.string().required(),
    brand: Joi.string().required(),
    company: Joi.string(),
    list: Joi.string(),
    listSubscription: Joi.string(),
    quantity: Joi.number().integer().required(),
    priceValue: Joi.number().integer().required(),
    currency: Joi.string().default("R$"),
    currencyCode: Joi.string().default("BRL"),
    costValue: Joi.number().integer(),
    deliverDate: Joi.date().iso().required(),
    pickupDate: Joi.date().iso(),

    grossTotalPrice: Joi.number().integer().required(),
    totalSellerPrice: Joi.number().integer().required(),
    totalSellerFee: Joi.number().integer().empty(null).default(0),

    sellerFees: Joi.array().items(Joi.object().keys({
        id: Joi.string().required(),
        value: Joi.number().integer().required(),
        type: Joi.string().only([
            Types.SellerFeeType.PERCENTUAL,
            Types.SellerFeeType.FIXED
        ]).default(Types.SellerFeeType.PERCENTUAL)
    })).empty(null).default([]),

    stockedQuantity: Joi.number().integer().default(0),

    productSupplyType: Joi.string().required(),

    status: Joi.string().only([
        Types.Status.UNAPPROVED,
        Types.Status.PENDING,
        Types.Status.READY,
        Types.Status.STOCKED
    ]).default(Types.Status.UNAPPROVED),

    statusPriority: Joi.number().integer().default(Types.StatusPriority.indexOf(Types.Status.PENDING)),

    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
