let lodash          = require("lodash"),
    LoggerFactory   = require("common-logger"),
    UserSrv         = require("services/user"),
    Kafka           = require("./kafka");

let Logger = new LoggerFactory("utils.notification");

module.exports = class Notification {
    static emitEmailToUsers(users, message, trackId) {
        let logger = Logger.create("emitEmail", trackId);
        logger.info("enter", {message});

        // Split args
        let {type,body} = message;

        // Emit to each user
        for(let user of users) {
            logger.debug("email", {email: user.email});

            Kafka.emit(`notification:email:${type}`, {
                to: [user.email],
                body,
                user
            });
        }
    }

    static emitAlertToUsers(users, message, trackId) {
        let logger = Logger.create("emitAlert", trackId);
        logger.info("enter", {message});

        // Split args
        let {data} = message;

        // Emit to each user
        for(let user of users) {
            logger.debug("user id", {id: user._id});

            data.users = lodash.map(users, "_id");
            
            Kafka.emit("notification:alert", {
                data,
                trackId
            });
        }
    }

    static emitSMSToUsers(users, message, trackId) {
        let logger = Logger.create("emitSMS", trackId);
        logger.info("enter", {message});

        // Split message
        let {type,body} = message;

        // Emit to each user
        for(let user of users) {
            if(!user.phones || !user.phones.length){continue;}

            let phone = lodash.find(user.phones, (phone) => {
                return phone.isMain;
            }) || user.phones[0];

            // Stringify phone
            phone = `${phone.countryCode}${phone.areaCode}${phone.number}`;

            logger.debug("user phone", {phone});

            Kafka.emit(`notification:sms:${type}`, {
                to: [phone], body, user
            });
        }
    }

    /**
     * This function emit notifications to a grupo of users.
     */
    static async emit(messages, trackId) {
        let logger = Logger.create("emit", trackId);
        logger.info("enter", {messages});

        let message,
            usersMap = {},
            roleUsersMap = {};

        // First collect all users and roles from messages.
        let users = [];
        let roles = [];

        for(message of messages) {
            if(message.users) { users = users.concat(message.users); }
            if(message.roles) { roles = roles.concat(message.roles); }
        }

        // Remove duplicates.
        users = lodash.uniq(users);
        roles = lodash.uniq(roles);

        // First find all users
        if(users.length) {
            try {
                users = await UserSrv.client.find({_id: users});
                logger.debug("user service find success", users);
            }
            catch(error) {
                logger.error("user service find error", error);
            }
        }

        // Then find users with roles
        if(roles.length) {
            try {
                roles = await UserSrv.client.find({roles});
                logger.debug("user service find with roles success", roles);
            }
            catch(error) {
                logger.error("user service find with roles error", error);
            }
        }

        // Concat all users and remove duplicates.
        users = users.concat(roles);
        users = lodash.uniqWith(users, lodash.isEqual);

        logger.debug("all users", users);

        // Let's build usersMap and roleUsersMap.
        for(let user of users) {
            usersMap[user._id] = user;

            for(let role of user.roles) {
                roleUsersMap[role] = roleUsersMap[role]||[];
                roleUsersMap[role].push(user);
            }
        }

        logger.debug("maps", {usersMap, roleUsersMap});


        // Now we can iterate over messages and emit them
        // to it's specific channel.
        for(message of messages) {
            let usersToEmit = lodash.values(lodash.pick(usersMap, message.users));

            // Concat role users.
            for(let role of message.roles||[]) {
                usersToEmit = usersToEmit.concat(roleUsersMap[role]);
            }

            // Prevent user with many roles to be duplicated.
            usersToEmit = lodash.uniqWith(usersToEmit, lodash.isEqual);

            logger.debug("usersToEmit", usersToEmit);

            // Send to channel.
            switch(message.channel) {
                case "email": Notification.emitEmailToUsers(usersToEmit, message, trackId); break;
                case "alert": Notification.emitAlertToUsers(usersToEmit, message, trackId); break;
                case "sms": Notification.emitSMSToUsers(usersToEmit, message, trackId); break;
            }
        }
    }
};