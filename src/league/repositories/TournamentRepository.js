const mongoose = require('mongoose');
const { sessionOptions } = require('../../database/sessionOptions');

function getModel() {
    return mongoose.model('Tournament');
}

const TournamentRepository = {
    create: (data, session = null) => {
        if (session) {
            return getModel().create([data], sessionOptions(session)).then((docs) => docs[0]);
        }

        return getModel().create(data);
    },

    findById: (tournamentId) =>
        getModel().findById(tournamentId).lean().exec(),

    findByLeagueAndSeason: (leagueId, season) =>
        getModel().findOne({ leagueId, season }).lean().exec(),

    findActiveByLeague: (leagueId) =>
        getModel().findOne({
            leagueId,
            status: { $nin: ['completed', 'cancelled'] },
        }).lean().exec(),

    findLatestByLeague: (leagueId) =>
        getModel().findOne({ leagueId }).sort({ season: -1 }).lean().exec(),

    listByLeague: (leagueId) =>
        getModel().find({ leagueId }).lean().exec(),

    updateById: (tournamentId, update, session = null) =>
        getModel().findByIdAndUpdate(
            tournamentId,
            { $set: update },
            { new: true, ...sessionOptions(session) },
        ).lean().exec(),

    deleteByLeague: (leagueId, session = null) =>
        getModel().deleteMany({ leagueId }, sessionOptions(session)).exec(),

    deleteAllByGuild: (guildId) =>
        getModel().deleteMany({ guildId }).exec(),
};

module.exports = TournamentRepository;
