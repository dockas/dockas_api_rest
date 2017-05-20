let Joi         = require("joi"),
    lodash      = require("lodash"),
    moment      = require("moment"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.array().items(Joi.string()).empty(null),
    creator: Joi.array().items(Joi.string()).empty(null),
    brand: Joi.array().items(Joi.string()).empty(null),
    name: Joi.alternatives().try(
        Joi.string().empty(null),
        Joi.object().keys({
            gt: Joi.string().empty(null),
            gte: Joi.string().empty(null),
            lt: Joi.date().iso().empty(null),
            lte: Joi.string().empty(null),
        }).empty(null)
    ),
    nameId: Joi.string().empty(null),
    description: Joi.string().empty(null),
    tags: Joi.array().items(Joi.string()).empty(null),
    createdAt: Joi.object().keys({
        gt: Joi.date().iso().empty(null),
        gte: Joi.date().iso().empty(null),
        lt: Joi.date().iso().empty(null),
        lte: Joi.date().iso().empty(null)
    }).empty(null),
    count: Joi.object().keys({
        gt: Joi.number().integer().empty(null),
        gte: Joi.number().integer().empty(null),
        lt: Joi.number().integer().empty(null),
        lte: Joi.number().integer().empty(null)
    }).empty(null),
    priority: Joi.alternatives().try(
        Joi.number().integer().empty(null),
        Joi.object().keys({
            gt: Joi.number().integer().empty(null),
            gte: Joi.number().integer().empty(null),
            lt: Joi.number().integer().empty(null),
            lte: Joi.number().integer().empty(null)
        }).empty(null)
    ),
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
