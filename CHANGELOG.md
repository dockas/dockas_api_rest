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
FEA : Implements the billing service for transparent checkout.
FEA : Implements a Moip adaptor for billing service.
ENH : Replace alert service by notification service.
ENH : Replace mongodb by arangodb in tag service to deal with graph relationship among tags.
ENH : Create an order in billing service as soon as the order is created by order service.
ENH : Convert all float prices (product,order) to int (cents unity).
ENH : Create a customer profile of user in billing service as soon user is created.
ENH : Replace count by quantity in order and list data models.
ENH : Reimplement createFromCSV route handler using new createCategoryEdge core service method.
ENH : Validate maxBrandCount and maxProductCount in brand and product create methods.
ENH : Prevent user other than admin to create a brand with status other than NOT_APPROVED.
ENH : Allow any user to create not approved brand an products.
FEA : Add find and findById methods to file service.
FEA : Send email to admins on invitation create.
FEA : Handle in order controller the order.payment_succeeded event comming from billing service adaptor.
ENH : Prevent user other than admin to create a product with status other than NOT_APPROVED.
FEA : Add generateCategory method to product utils module.
FEA : Add arango as database for tag service.
FEA : Add incFindCount method to tag api controller to increment tag find count.
FEA : Send email to admins on user signup.
FEA : Process billing notification in moip adaptor.
ENH : Remove hard coded birhdate in moip source module.
ENH : Set birthdate as required to billing source. 
ENH : Emit event on brand create and return brand created data to the caller.
ENH : Parse query owners field in find parse module of brand service.
FEA : Notify all users of brand created event through socket.
ENH : New email service architecture (with localized templates and i18n string files).
ENH : Add public and private status to list service create module model.
ENH : Change notification status to integer (which now allows sorting with new notifications comming first).
ENH : Return all order data created instead of just id.
ENH : Change order status names to *payment_pending*, *payment_authorized*, *packaged*, *delivering*, *delivered*.
FEA : Add findByBillingOrderId method to order service.
ENH : Add Intl npm module to polyfill node localizaton.
ENH : Return all price data created instead of just id.
ENH : Add category and stock to product create model.
ENH : Notify all users about product update.
FEA : Add nameWithArango to Generate util module.
ENH : Add billing.notifications.port to default config.
ENH : Remove unique attribute of billingCustomer in user collection.
ENH : Replace graphicmagick by imagemagick.
ENH : Split notification in *notification_alert*, *notification_email* and (soon) *notification_sms*.
ENH : Refactor all email service to new notification_email.
ENH : Add [ADMIN] string in admin message email subject.
ENH : Set data as joi valid value in user update to applt phone default country code.
FEA : Implements notification sms service.
ENH : Use user.postalCodeAddress to set an almost legitimate shippingAddress in moip customer (Moip requirement). This strategy allows our payment flow to be all in one page at the webapp.
FEA : Implement a postal code service to find assotiated address (only for Brazil, right now).
ENH : Require postalCodeAddress (i.e., only based on an informed postalCode) to create an invitation.
ENH : Return full user data from create method of user service.
ENH : Add state and country to order address.
ENH : Replace postal code service by an address service.
ENH : Update product stock on order create.
FEA : Add product controller updateStatus route.
ENH : Remove authPolicy from tag controller incFindCount route.
ENH : Remove all notifications registered at moip and create them again if target url changed or there is more than 1 notification registered.
ENH : Allow admins to update products (stock).
ENH : Add env flag to email subject.
FEA : Create list_subscription service.
FEA : Create wallet service.
FEA : Create transfer service.
ENH : Use mjml email template instead of pug.
FEA : Create order utils with getTotalFee method (used when we gonna generate a order from a list subscription).
FEA : Add fee schema in config order section.
ENH : Generate cron pattern for days dinamically based on which weekdays are allowed to deliver.
ENH : Create a brand wallet on brand creation.
ENH : Add findOrders method to brand controller which group orders main data by status and pickupDate.
ENH : Add findTransfers method to brand controller.
ENH : Remove minimum total price requirement for an order.
ENH : Split user update method into update and updateMe.
ENH : Add validatePassword method to auth service (used in list_subscription order approve flow).
ENH : Hash sensitive credit_card info required by moip adaptor to prevent insert it every time (boring!!!).
FEA : Auto approve a certain number per week of invitations.
ENH : Generate list nameId from name.
ENH : Add deliverDate, pickupDate and hero to order schema.
FEA : Add order updateItemStatus to enable update of single item status.
ENH : Add supplyType to product schema (values are *on_stock* and *on_demand*).
ENH : Prevent product stock change from list_subscription orders.
ENH : Add user roles for seller and hero.
FIX : Forget to add change before commit! Sorry :)
FEA : Split order items to it's own collection with grossTotalPrice, totalSellerPrice, totalSellerFee, sellerFees info.
FEA : Add productCount to tag schema.
FEA : Add costValue and validityDate to product schema.
ENH : Change price schema to decouple from product and enable price type to be more generic.
BUG : Correct a bug with missing console.log second parameter.
BUG : Correct a bug that not consider fees to billing order.