let Joi         = require("joi"),
    lodash      = require("lodash"),
    moment      = require("moment"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.array().items(Joi.string()).empty(null),
    creator: Joi.array().items(Joi.string()).empty(null),
    name: Joi.string().empty(null),
    nameId: Joi.array().items(Joi.string()).empty(null),
    createdAt: Joi.object().keys({
        gt: Joi.date().iso().empty(null),
        gte: Joi.date().iso().empty(null),
        lt: Joi.date().iso().empty(null),
        lte: Joi.date().iso().empty(null)
    }).empty(null),
    select: Joi.array().items(Joi.string()).empty(null),
    sort: Joi.object(),
    includeDeleted: Joi.boolean().empty(null)
});

module.exports.format = function(instances) {
    let fn = (instance) => {
        let formated = lodash.clone(instance);
        formated.createdAt = instance.createdAt?moment(instance.createdAt).toISOString():null;
        formated.updatedAt = instance.updatedAt?moment(instance.createdAt).toISOString():null;

        return new Types.Data(formated);
    };

    return lodash.isArray(instances) ? lodash.map(instances, (instance) => {
        return fn(instance);
    }) : fn(instances);
};
