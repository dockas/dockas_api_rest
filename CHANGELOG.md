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