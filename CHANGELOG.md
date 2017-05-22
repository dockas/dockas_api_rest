# Version 0.0.0
INI : Set basic embeaded micro-services structure (core module) and basic auth/user functionalities.
FEA : Add product, file and user core services.
FEA : Add file upload functionality.
FEA : Create price, order and tag core services. 
ENH : Many services model refactoring.
ENH : Remove thrift installation from Dockerfile.
ENH : User consul to discover mongo and redis hosts.
ENH : Add stage rule to Makefile.
BUG : Workaround a Joi bug where default addresses and roles array are not created on user creation.
BUG : Add try-catch block around createImageThumbs function in core/file/upload module to prevent unhandled errors from thumbs creation.
ENH : Ignore logs folder.
BUG : Correct a bug with clean method in file upload module that prevents product creation.
BUG : Add missing graphicsmagic to container.
FEA : Add owner to product core service.
ENH : Return all data for a created file instead of just it's id in file core service.
FEA : Add a lot of new fields to product model.
FEA : Add findByNameId method to product controller.
ENH : Validate invitation within signup method in user controller.
ENH : Return the whole file created data in upload method (not just the id).
ENH : Add findByEmail method to user service.
ENH : Add email service with send invitation method.
ENH : Create a kafka mock service through event emitter.
FEA : Add stage.yml config file for stage environment.
FEA : Add alert, brand, coupon, list and socket services.
ENH : Enable to populate brand in product data.
ENH : Remove owner from product find model and query perser.
FEA : Add createFromCsv method to brand, tag and product api controllers.
ENH : Generate product nameId when not provided.
ENH : Enable to find brands by multiple nameIds.
ENH : Add __version data to all service data models.
ENH : Remove requirement of mainImage and images from product model.
ENH : Add brand as required to product model.
ENH : Add nameId to tag data model.
ENH : Generate tag nameId when not provided.
ENH : Enable to find tags by multiple nameIds.
ENH : Replace lower/upper keys in find model range fields by gt/lt/gte/lte (more mongo alike).
FEA : Create company service.
ENH : Add company field to brands.
ENH : Allow to populate brand and brand.company in product controller find method.
ENH : Allow to populate company in brand controller find method.
ENH : Allow to passing nameValue as argument in Generate.name function (use case: product parsing of nameId).
FEA : Add endpoint to get shared config.
ENH : Allow phone in user address.
ENH : Create phones list in user profile.
ENH : Change minimum order total price to 70.00.
ENH : Count success/error items in createFromCSV methods (brand,company,tag,product).
FEA : Add priceGroups to product model.
BUG : Correct a bug with misspeling of "phones" in user create method.
ENH : Allow to specify a regex expression in product name "object" find query data.