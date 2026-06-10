const mongoose = require('mongoose');

function getModel() {
    return mongoose.model('Team');
}

const TeamRepository = {
    create: (data) => getModel().create(data),

    findById: (teamId) =>
        getModel().findById(teamId).lean().exec(),

    findByLeagueAndName: (leagueId, name) => {
        const normalized = name.trim().toLowerCase();

        return getModel().findOne({
            leagueId,
            $or: [
                { nameLower: normalized },
                { name: name.trim() }
            ]
        }).lean().exec();
    },

    listActiveByLeague: (leagueId) =>
        getModel().find({ leagueId, isActive: true }).sort({ name: 1 }).lean().exec(),

    listByLeague: (leagueId) =>
        getModel().find({ leagueId }).sort({ name: 1 }).lean().exec(),

    countActiveByLeague: (leagueId) =>
        getModel().countDocuments({ leagueId, isActive: true }).exec(),

    updateById: (teamId, update) =>
        getModel().findByIdAndUpdate(teamId, { $set: update }, { new: true }).lean().exec(),

    deleteByLeague: (leagueId) =>
        getModel().deleteMany({ leagueId }).exec(),

    deleteAllByGuild: (guildId) =>
        getModel().deleteMany({ guildId }).exec()
};

module.exports = TeamRepository;