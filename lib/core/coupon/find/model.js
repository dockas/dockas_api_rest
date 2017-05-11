let Joi         = require("joi"),
    lodash      = require("lodash"),
    moment      = require("moment"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.array().items(Joi.string()).empty(null),
    nameId: Joi.string(),
    users: Joi.array().items(Joi.string()).empty(null),
    products: Joi.array().items(Joi.string()).empty(null),
    brands: Joi.array().items(Joi.string()).empty(null),
    appliers: Joi.array().items(Joi.string()).empty(null),
    valueType: Joi.string().only([
        Types.VALUE_TYPE_PERCENTUAL,
        Types.VALUE_TYPE_MONETARY
    ]),
    createdAt: Joi.object().keys({
        lower: Joi.date().iso().empty(null),
        upper: Joi.date().iso().empty(null)
    }).empty(null),
    select: Joi.array().items(Joi.string()).empty(null),
    sort: Joi.object(),
    limit: Joi.number().integer().empty(null),
    includeDeleted: Joi.boolean().empty(null)
});

module.exports.format = function(instances) {
    let fn = (instance) => {
        let formated = lodash.clone(instance);
        formated._id = instance._id.toString();
        formated.createdAt = instance.createdAt?moment(instance.createdAt).toISOString():null;
        formated.updatedAt = instance.updatedAt?moment(instance.createdAt).toISOString():null;

        return new Types.Data(formated);
    };

    return lodash.isArray(instances) ? lodash.map(instances, (instance) => {
        return fn(instance);
    }) : fn(instances);
};
