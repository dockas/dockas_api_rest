let Joi         = require("joi"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.strip(),
    creator: Joi.string().required(),
    brand: Joi.string().empty(null),
    name: Joi.string().required(),
    nameId: Joi.string().regex(/^[a-z0-9-]+$/).empty(null),
    priority: Joi.number().integer().empty(null).default(0),
    description: Joi.string().empty(null).empty(""),
    priceValue: Joi.number().integer().required(),
    priceUnity: Joi.string().empty(null).default("item"),
    priceGroups: Joi.array().items(Joi.object().keys({
        count: Joi.number().required(),
        unity: Joi.string().required()
    })).empty(null),
    currencySymbol: Joi.string().empty(null).default("R$"),
    currencyCode: Joi.string().empty(null).default("BRL"),

    // Default visible tags for this product.
    selectedTags: Joi.array().items(Joi.string()).min(1).empty(null),

    // List all tags attached to this product. This list 
    // is build upon selected tags list and should not be changed
    // directly. This list collects all tags in the same 
    // tags "chain" as a selected tag. For example, for 
    // selectedTags ["laticinio","zero-gordura"] we build 
    // the tags list expanding selectedTags to 
    // ["bebida","laticinio","saudavel","zero-gordura"]
    // where we have two tags chain: (1) bebida->laticinio->zero-lactose
    // and (2) saudavel->zero-gordura.
    tags: Joi.array().items(Joi.string()).min(1).empty(null),

    // From all categories hierachy we build a category code
    // using the format "category_priority:category_name". So,
    // if categories is ["bebida", "laticinio"] and the priority
    // of this tags are 0,0 respectivelly, then we gonna end with
    // a categoryCode of 0:bebida:0:laticinio.
    category: Joi.string().required(),
    
    // Status
    status: Joi.string().only([
        Types.STATUS_NOT_APPROVED,
        Types.STATUS_PUBLIC,
        Types.STATUS_PRIVATE
    ]).empty(null).default(Types.STATUS_NOT_APPROVED),

    stock: Joi.number().integer().empty(null).default(0),
    mainProfileImage: Joi.string().empty(null),
    profileImages: Joi.array().items(Joi.string()).empty(null).default([]),
    images: Joi.array().items(Joi.string()).empty(null).default([]),
    createdAt: Joi.date().iso().empty(null),
    updatedAt: Joi.date().iso().empty(null),
    deletedAt: Joi.date().iso().allow(null),
    __version: Joi.string().forbidden().default(1)
});
