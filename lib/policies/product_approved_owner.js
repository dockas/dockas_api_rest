/**
 * This module is responsible for admin role policy middleware.
 *
 * @module
 *     policies/profile
 * @copyright
 *     Bruno Fonseca
 */
let lodash          = require("lodash"),
    ProductSrv      = require("services/product"),
    BrandSrv        = require("services/brand"),
    CompanySrv      = require("services/company"),
    LoggerFactory   = require("common-logger"),
    Types           = require("../types");

// Instantiate the logger factory.
let Logger = new LoggerFactory("policies.product_approved_owner");

module.exports = async function(req, res, next) {
    let product,
        brand,
        company,
        owner,
        logger = Logger.create("middleware", req.trackId);

    try {
        product = await ProductSrv.client.findById(req.params.id, req.trackId);
        logger.debug("product service findById success", product);
    }
    catch(error) {
        return res.serverError(error);
    }

    try {
        brand = await BrandSrv.client.findById(product.brand, req.trackId);
        logger.debug("brand service findById success", brand);
    }
    catch(error) {
        return res.serverError(error);
    }

    // Let's check for brand owner.
    owner = lodash.find(brand.owners, (owner) => {
        return owner.user == req.uid;
    });

    // Let's check company owner
    if(!owner) {
        try {
            company = await CompanySrv.client.findById(brand.company, req.trackId);
            logger.debug("company service findById success", company);
        }
        catch(error) {
            return res.serverError(error);
        }

        owner = lodash.find(company.owners, (owner) => {
            return owner.user == req.uid;
        });
    }

    // Let's check owner
    if(!owner) {
        return res.unauthorized(new Types.ApiError({
            code: Types.ErrorCode.ONLY_OWNERS_ALLOWED,
            message: "you must be an owner to perform this request"
        }));
    }
    else if(owner.status != "approved") {
        return res.unauthorized(new Types.ApiError({
            code: Types.ErrorCode.ONLY_AUTHORIZED_OWNERS_ALLOWED,
            message: "you must be an authorized owner to perform this request"
        }));
    }

    // Go to next step.
    next();
};
