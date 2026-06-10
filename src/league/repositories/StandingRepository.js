const mongoose = require('mongoose');
const { sessionOptions } = require('../../database/sessionOptions');

function getModel() {
    return mongoose.model('Standing');
}

const StandingRepository = {
    upsert: (leagueId, guildId, entries, version, session = null) =>
        getModel().findOneAndUpdate(
            { leagueId },
            {
                $set: {
                    guildId,
                    entries,
                    calculatedAt: new Date(),
                    version
                }
            },
            { upsert: true, new: true, ...sessionOptions(session) }
        ).lean().exec(),

    findByLeague: (leagueId, session = null) =>
        getModel().findOne({ leagueId }).session(session ?? null).lean().exec(),

    deleteByLeague: (leagueId, session = null) =>
        getModel().deleteOne({ leagueId }, sessionOptions(session)).exec(),

    deleteAllByGuild: (guildId) =>
        getModel().deleteMany({ guildId }).exec()
};

module.exports = StandingRepository;