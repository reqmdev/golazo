const mongoose = require('mongoose');
const { sessionOptions } = require('../../database/sessionOptions');

function getModel() {
    return mongoose.model('TournamentStanding');
}

const TournamentStandingRepository = {
    upsert: (tournamentId, groupId, guildId, entries, session = null) =>
        getModel().findOneAndUpdate(
            { tournamentId, groupId },
            {
                $set: {
                    entries,
                    calculatedAt: new Date(),
                    guildId,
                },
                $inc: { version: 1 },
            },
            { upsert: true, new: true, ...sessionOptions(session) },
        ).lean().exec(),

    findByTournamentAndGroup: (tournamentId, groupId) =>
        getModel().findOne({ tournamentId, groupId }).lean().exec(),

    listByTournament: (tournamentId) =>
        getModel().find({ tournamentId }).sort({ groupId: 1 }).lean().exec(),

    deleteByTournament: (tournamentId, session = null) =>
        getModel().deleteMany({ tournamentId }, sessionOptions(session)).exec(),

    deleteAllByGuild: (guildId) =>
        getModel().deleteMany({ guildId }).exec(),
};

module.exports = TournamentStandingRepository;
