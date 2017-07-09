let Joi     = require("joi"),
    Types   = require("../types");

// Main Schema
let Schema = Joi.object().keys({
    deliverDate: Joi.date().iso(),
    pickupDate: Joi.date().iso(),
    stockedQuantity: Joi.number().integer(),

    status: Joi.string().only([
        Types.Status.PENDING,
        Types.Status.READY,
        Types.Status.STOCKED
    ]).default(Types.Status.PENDING)
});

// Export
module.exports.Schema = Schema;
