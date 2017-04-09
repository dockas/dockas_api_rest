let Joi         = require("joi"),
    lodash      = require("lodash");

module.exports.Schema = Joi.object().keys({
    _id: Joi.array().items(Joi.string()).empty(null),
    email: Joi.string().empty(null),
    select: Joi.array().items(Joi.string()).empty(null),
    createdAt: Joi.object().keys({
        lower: Joi.date().iso().empty(null),
        upper: Joi.date().iso().empty(null)
    }).empty(null),
    includeDeleted: Joi.boolean().empty(null)
});

module.exports.format = function(instances) {
    let fn = (instance) => {
        let formated = {};
        formated._id = instance._id.toString();

        // Remove password.
        formated.password = null;

        return lodash.assign({}, instance, formated);
    };

    return lodash.isArray(instances) ? lodash.map(instances, (instance) => {
        return fn(instance);
    }) : fn(instances);
};
