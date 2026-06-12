const mongoose = require('mongoose');
const { MATCH_STATUS } = require('../constants/matchStatus');
const { SUBMITTABLE_STATUSES, CORRECTABLE_STATUSES, UNRESOLVED_ROUND_STATUSES } = require('../match/constants');
const { sessionOptions } = require('../../database/sessionOptions');

function getModel() {
    return mongoose.model('Match');
}

/** League-only matches (excludes Champions League / tournament fixtures). */
const LEAGUE_ONLY_FILTER = { tournamentId: null };

const MatchRepository = {
    bulkInsert: (matches, session = null) =>
        getModel().insertMany(matches, { ordered: true, ...sessionOptions(session) }),

    countByLeague: (leagueId) =>
        getModel().countDocuments({ leagueId, ...LEAGUE_ONLY_FILTER }).exec(),

    countCompletedByLeague: (leagueId) =>
        getModel().countDocuments({ leagueId, ...LEAGUE_ONLY_FILTER, status: MATCH_STATUS.COMPLETED }).exec(),

    countByLeagueWithStatuses: (leagueId, statuses) =>
        getModel().countDocuments({ leagueId, ...LEAGUE_ONLY_FILTER, status: { $in: statuses } }).exec(),

    deleteByLeagueWithStatuses: (leagueId, statuses, session = null) =>
        getModel().deleteMany({ leagueId, ...LEAGUE_ONLY_FILTER, status: { $in: statuses } }, sessionOptions(session)).exec(),

    listByLeagueWithStatuses: (leagueId, statuses, session = null) =>
        getModel()
            .find({ leagueId, ...LEAGUE_ONLY_FILTER, status: { $in: statuses } })
            .sort({ leg: 1, round: 1 })
            .session(session ?? null)
            .lean()
            .exec(),

    deleteAllByLeague: (leagueId, session = null) =>
        getModel().deleteMany({ leagueId }, sessionOptions(session)).exec(),

    deleteTournamentByLeague: (leagueId, session = null) =>
        getModel().deleteMany({ leagueId, tournamentId: { $ne: null } }, sessionOptions(session)).exec(),

    findById: (matchId) =>
        getModel().findById(matchId).lean().exec(),

    findByLeagueAndRound: (leagueId, round, leg = null) => {
        const filter = { leagueId, ...LEAGUE_ONLY_FILTER, round };

        if (leg !== null) {
            filter.leg = leg;
        }

        return getModel().find(filter).sort({ leg: 1 }).lean().exec();
    },

    findBetweenTeams: (leagueId, homeTeamId, awayTeamId, statuses, round = null) => {
        const filter = {
            leagueId,
            ...LEAGUE_ONLY_FILTER,
            $or: [
                { homeTeamId, awayTeamId },
                { homeTeamId: awayTeamId, awayTeamId: homeTeamId }
            ],
            status: { $in: statuses }
        };

        if (round !== null) {
            filter.round = round;
        }

        return getModel().find(filter).sort({ round: 1, leg: 1 }).lean().exec();
    },

    findSubmittableBetweenTeams: (leagueId, homeTeamId, awayTeamId, round = null) =>
        MatchRepository.findBetweenTeams(leagueId, homeTeamId, awayTeamId, SUBMITTABLE_STATUSES, round),

    findCorrectableBetweenTeams: (leagueId, homeTeamId, awayTeamId, round = null) =>
        MatchRepository.findBetweenTeams(leagueId, homeTeamId, awayTeamId, CORRECTABLE_STATUSES, round),

    listByLeague: (leagueId, { statuses = null } = {}, session = null) => {
        const filter = { leagueId, ...LEAGUE_ONLY_FILTER };

        if (statuses) {
            filter.status = { $in: statuses };
        }

        return getModel()
            .find(filter)
            .sort({ leg: 1, round: 1 })
            .session(session ?? null)
            .lean()
            .exec();
    },

    updateById: (matchId, update) =>
        getModel().findByIdAndUpdate(matchId, { $set: update }, { new: true }).lean().exec(),

    /**
     * Optimistic lock — returns null on version conflict (concurrent update).
     */
    updateWithVersion: (matchId, expectedVersion, update, session = null) =>
        getModel().findOneAndUpdate(
            { _id: matchId, resultVersion: expectedVersion ?? 0 },
            { $set: update, $inc: { resultVersion: 1 } },
            { new: true, ...sessionOptions(session) }
        ).lean().exec(),

    /**
     * Restore a match to a prior snapshot (compensation path when standings fail).
     *
     * @param {import('mongoose').Types.ObjectId | string} matchId
     * @param {{ status: string, score: object, meta: object, resultVersion: number }} snapshot
     * @param {import('mongoose').ClientSession | null} [session]
     */
    restoreSnapshot: (matchId, snapshot, session = null) =>
        getModel().findByIdAndUpdate(
            matchId,
            {
                $set: {
                    status: snapshot.status,
                    score: snapshot.score,
                    meta: snapshot.meta,
                    resultVersion: snapshot.resultVersion,
                },
            },
            { new: true, ...sessionOptions(session) }
        ).lean().exec(),

    countUnresolvedInRound: (leagueId, round) =>
        getModel().countDocuments({
            leagueId,
            ...LEAGUE_ONLY_FILTER,
            round,
            status: { $in: UNRESOLVED_ROUND_STATUSES }
        }).exec(),

    listByTournament: (tournamentId, { groupId = null, knockoutRound = null } = {}) => {
        const filter = { tournamentId };

        if (groupId) {
            filter.groupId = groupId;
        }

        if (knockoutRound) {
            filter.knockoutRound = knockoutRound;
        }

        return getModel().find(filter).sort({ round: 1, leg: 1, groupId: 1 }).lean().exec();
    },

    findByTournamentAndTie: (tournamentId, tieId) =>
        getModel().find({ tournamentId, tieId }).sort({ leg: 1 }).lean().exec(),

    findSubmittableByTournament: (tournamentId, statuses = SUBMITTABLE_STATUSES) =>
        getModel().find({ tournamentId, status: { $in: statuses } })
            .sort({ round: 1, leg: 1 })
            .lean()
            .exec(),

    findByIdInTournament: (matchId, tournamentId) =>
        getModel().findOne({ _id: matchId, tournamentId }).lean().exec(),

    countUnresolvedInTournamentGroupRound: (tournamentId, groupId, round) =>
        getModel().countDocuments({
            tournamentId,
            groupId,
            round,
            status: { $in: UNRESOLVED_ROUND_STATUSES },
        }).exec(),

    countUnresolvedInTournamentKnockoutRound: (tournamentId, knockoutRound) =>
        getModel().countDocuments({
            tournamentId,
            knockoutRound,
            status: { $in: UNRESOLVED_ROUND_STATUSES },
        }).exec(),

    deleteByTournament: (tournamentId, session = null) =>
        getModel().deleteMany({ tournamentId }, sessionOptions(session)).exec(),

    deleteAllByGuild: (guildId) =>
        getModel().deleteMany({ guildId }).exec()
};

module.exports = MatchRepository;