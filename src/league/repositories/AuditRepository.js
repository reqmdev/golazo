const mongoose = require('mongoose');

function getModel() {
    return mongoose.model('LeagueAuditLog');
}

const AuditRepository = {
    create: (data) => getModel().create(data),

    listByLeague: (leagueId, { limit = 10 } = {}) =>
        getModel()
            .find({ leagueId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()
            .exec(),

    deleteByLeague: (leagueId) =>
        getModel().deleteMany({ leagueId }).exec(),

    deleteAllByGuild: (guildId) =>
        getModel().deleteMany({ guildId }).exec()
};

module.exports = AuditRepository;