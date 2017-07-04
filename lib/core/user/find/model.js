let Joi         = require("joi"),
    lodash      = require("lodash"),
    Types       = require("../types");

module.exports.Schema = Joi.object().keys({
    _id: Joi.array().items(Joi.string()).empty(null),
    email: Joi.string().empty(null),
    select: Joi.array().items(Joi.string()).empty(null),
    createdAt: Joi.object().keys({
        gt: Joi.date().iso().empty(null),
        gte: Joi.date().iso().empty(null),
        lt: Joi.date().iso().empty(null),
        lte: Joi.date().iso().empty(null)
    }).empty(null),
    roles: Joi.array().items(Joi.string().only([
        Types.Role.USER,
        Types.Role.ADMIN,
        Types.Role.SELLER
    ])).empty(null),
    includeDeleted: Joi.boolean().empty(null)
});

module.exports.format = function(instances) {
    let fn = (instance) => {
        let formated = {};
        formated._id = instance._id.toString?instance._id.toString():instance._id;

        // Remove password.
        formated.password = null;

        return lodash.assign({}, instance, formated);
    };

    return lodash.isArray(instances) ? lodash.map(instances, (instance) => {
        return fn(instance);
    }) : fn(instances);
};
