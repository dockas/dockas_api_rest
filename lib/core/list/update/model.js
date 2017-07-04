let Joi     = require("joi");

// Item schema
let ItemSchema = Joi.object().keys({
    product: Joi.string().required(),
    quantity: Joi.number().integer().required()
});

// Main Schema
let Schema = Joi.object().keys({
    name: Joi.string(),
    nameId: Joi.string(),
    owners: Joi.array().items(Joi.object().keys({
        user: Joi.string().required()
    })).min(1),
    items: Joi.array().items(ItemSchema),
    recurrence: Joi.string()
});

// Export
module.exports.ItemSchema = ItemSchema;
module.exports.Schema = Schema;
