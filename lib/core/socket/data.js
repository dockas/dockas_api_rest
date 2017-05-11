let data = {};

data[process.env.NOMAD_ALLOC_ID] = {
    userSocketIds: {},
    roleUserIds: {}
};

module.exports = data;