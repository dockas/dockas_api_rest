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
