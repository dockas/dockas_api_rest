let Joi                 = require("joi"),
    moment              = require("moment"),
    lodash              = require("lodash"),
    LoggerFactory       = require("common-logger"),
    config              = require("common-config"),
    TokenUtil           = require("common-utils/lib/token"),
    Thrift              = require("common-utils/lib/thrift"),
    Types               = require("../types"),
    hash                = require("utils/hash"),
    Model               = require("./model");

let Logger = new LoggerFactory("user");

/**
 * The handler class.
 */
module.exports = class CreateHandler {
    /**
     * This function constructs a new handler instance.
     */
    constructor(opts = {}) {
        this.mode = opts.mode || "production";
        this.ticketUtil = opts.ticketUtil || new TokenUtil(config.activation.ticket);
        this.collection = opts.collection;
    }

    /**
     * This function creates a new user.
     *
     * @since 0.0.0
     *
     * @param  {object} profile
     *     User profile to be created into database.
     * @param  {string} trackId
     *     Hash string that tracks system requests through services.
     * @return {string}
     *     Identification string of created user.
     * @throws
     *     - INVALID_SCHEMA
     */
    async create(
        data,
        trackId
    ) {
        // Local variables
        let valid,
            user,
            logger = Logger.create("create", trackId),
            schema = Model.Schema;

        logger.info("enter", {data: data});
        data = Thrift.parse(data);

        // Validate data schema
        valid = Joi.validate(data, schema);

        if(valid.error) {
            logger.error("invalid schema", valid.error);

            throw new Types.UserError({
                code: Types.ErrorCode.INVALID_SCHEMA,
                message: valid.error.message
            });
        }

        // Add meta info
        data.active = false;
        data.createdAt = moment().toISOString();
        data.deletedAt = null;

        // @FIX : For some reason Joi is not creating default arrays.
        data.addresses = [];
        data.phones = [];
        data.roles = [Types.ROLE_USER];

        // Try to hash the password
        try{
            data.password = await hash(data.password);

            logger.debug("hash success", {
                pasword: Logger.secret(data.password)
            });
        }
        catch(error) {
            logger.error("hash error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.HASH_ERROR,
                message: error.message
            });
        }

        // Try to insert to collection
        try {
            user = await this.collection.insertOne(data);
            logger.info("collection insertOne success", {id: user.insertedId});
        }
        catch(error) {
            logger.error("collection insertOne error", error);

            let code = Types.ErrorCode.DB_ERROR;

            // Duplicate key error
            if(error.code == 11000) {
                let index = error.message.replace(/^.*index\: ([^ ]+) .*$/, "$1");

                logger.debug("collection insertOne error : duplicate key", {index});

                switch(index) {
                    case "email_1": code = Types.ErrorCode.EMAIL_DUPLICATED; break;
                    case "nickName_1": code = Types.ErrorCode.NICKNAME_DUPLICATED; break;
                    default: break;
                }
            }

            throw new Types.UserError({
                code,
                message: error.message
            });
        }

        // Create activation ticket
        /*if(this.mode !== "test") {
            this.createActivationTicket(
                data.email,
                logger.trackId
            );
        }*/

        return lodash.toString(user.insertedId);
    }

    /**
     * This function creates an activation ticket and sends it to user email.
     *
     * @since 0.0.0
     *
     * @param  {string} email
     *     User email.
     * @param  {string} trackId
     *     Hash string that tracks system requests through services.
     * @throws
     *     - DB_ERROR
     *     - INVALID_SIGNUP_TICKET
     */
    async createActivationTicket(
        email,
        trackId
    ) {
        // Local variables
        let ticket,
            //results,
            now = moment(),
            logger = Logger.create("createActivationTicket", trackId);

        logger.info("enter", {email: email});

        // Try to create the activation ticket
        try {
            ticket = await this.ticketUtil.create({
                email: email,
                createdAt: now.format(),
                expiresAt: now.add(config.activation.ticket.expiration, "seconds").format()
            }, logger.trackId);

            logger.info("ticketUtil create success", {ticket: ticket});
        }
        catch(error) {
            logger.error("ticketUtil create error", error);

            throw new Types.UserError({
                code: Types.ErrorCode.DB_ERROR,
                message: error.message
            });
        }

        // Try to send activation to kafka.
        /*try {
            results = await Kafka.shared.emit("email:user_activation", {
                ticket: ticket,
                email: email
            });

            logger.info("kafka send success", results);
        }
        catch(error) {
            logger.error("kafka send error", error);
            throw error;
        }*/

        // @TODO : Use sendgrid to send email.
    }
};
