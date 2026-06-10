const mongoose = require('mongoose');
const { sessionOptions } = require('../../database/sessionOptions');

function getModel() {
    return mongoose.model('League');
}

const LeagueRepository = {
    create: (data) => getModel().create(data),

    findByGuildAndSlug: (guildId, slug) =>
        getModel().findOne({ guildId, slug: slug.toLowerCase() }).lean().exec(),

    findById: (leagueId) =>
        getModel().findById(leagueId).lean().exec(),

    listByGuild: (guildId, { includeArchived = false } = {}) => {
        const filter = { guildId };

        if (!includeArchived) {
            filter.status = { $ne: 'archived' };
        }

        return getModel().find(filter).sort({ createdAt: -1 }).lean().exec();
    },

    countByGuild: (guildId) =>
        getModel().countDocuments({ guildId, status: { $ne: 'archived' } }).exec(),

    updateById: (leagueId, update, session = null) =>
        getModel().findByIdAndUpdate(leagueId, { $set: update }, { new: true, ...sessionOptions(session) }).lean().exec(),

    updateWithOperators: (leagueId, update) =>
        getModel().findByIdAndUpdate(leagueId, update, { new: true }).lean().exec(),

    deleteById: (leagueId) =>
        getModel().findByIdAndDelete(leagueId).lean().exec(),

    deleteAllByGuild: (guildId) =>
        getModel().deleteMany({ guildId }).exec()
};

module.exports = LeagueRepository;