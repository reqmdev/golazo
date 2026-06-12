const LeagueError = require('../errors/LeagueError');
const { AUDIT_ACTION } = require('../constants/auditAction');
const PermissionService = require('./PermissionService');
const LeagueService = require('./LeagueService');
const StandingService = require('./StandingService');
const AuditService = require('./AuditService');
const { invalidateLeagueRenderCache } = require('../discord/cacheInvalidation');
const TeamRepository = require('../repositories/TeamRepository');
const MatchRepository = require('../repositories/MatchRepository');
const LeagueRepository = require('../repositories/LeagueRepository');
const {
    assertSubmittable,
    assertCorrectable,
    buildSubmitUpdate,
    buildCorrectionUpdate,
    buildForfeitUpdate,
    resolveFixtureGoals
} = require('../match/matchProcessor');
const { pickUniqueMatch, assertDistinctTeams } = require('../match/matchLookup');
const { MATCH_STATUS } = require('../constants/matchStatus');
const { LEAGUE_STATUS } = require('../constants/leagueStatus');
const TournamentStandingService = require('./TournamentStandingService');
const TournamentService = require('./TournamentService');
const TournamentRepository = require('../repositories/TournamentRepository');

const STATUS_ACTION_FROM = {
    postpone: [MATCH_STATUS.SCHEDULED, MATCH_STATUS.LIVE],
    cancel: [MATCH_STATUS.SCHEDULED, MATCH_STATUS.LIVE, MATCH_STATUS.POSTPONED],
    resume: [MATCH_STATUS.POSTPONED],
};

const STATUS_ACTION_TO = {
    postpone: MATCH_STATUS.POSTPONED,
    cancel: MATCH_STATUS.CANCELLED,
    resume: MATCH_STATUS.SCHEDULED,
};

/**
 * @param {object} match
 * @param {object} update
 * @param {object} league
 */
/**
 * @param {object} match
 * @param {object} update
 * @param {object} league
 * @param {{ guildId: string, actorId: string, action: string, summary: string, metadata?: object }} audit
 */
async function persistMatchResult(match, update, league, audit) {
    const isTournamentMatch = Boolean(match.tournamentId);
    const snapshot = {
        status: match.status,
        score: match.score,
        meta: match.meta,
        resultVersion: match.resultVersion ?? 0,
    };

    const { updatedMatch, standing } = await runWithTransaction(async (session) => {
        const persistedMatch = await MatchRepository.updateWithVersion(
            match._id,
            match.resultVersion ?? 0,
            update,
            session
        );

        if (!persistedMatch) {
            throw new LeagueError('CONCURRENT_UPDATE');
        }

        try {
            const previousMatch = {
                ...match,
                status: snapshot.status,
                score: snapshot.score,
                meta: snapshot.meta ?? match.meta
            };

            let recalculated = null;

            if (isTournamentMatch) {
                recalculated = await TournamentStandingService.updateAfterMatch(
                    match.tournamentId,
                    league,
                    { updatedMatch: persistedMatch, previousMatch },
                    session,
                );
            } else {
                recalculated = await StandingService.updateAfterMatch(
                    league._id,
                    league,
                    { updatedMatch: persistedMatch, previousMatch },
                    session
                );
            }

            return {
                updatedMatch: persistedMatch,
                standing: recalculated,
            };
        } catch (err) {
            if (!session) {
                await MatchRepository.restoreSnapshot(match._id, snapshot, null);
            }

            throw new LeagueError('STANDINGS_FAILED');
        }
    });

    invalidateLeagueRenderCache(league._id.toString());

    if (isTournamentMatch) {
        const tournament = await TournamentRepository.findById(match.tournamentId);

        if (tournament) {
            await TournamentService.afterTournamentMatch(tournament, league);
        }
    } else {
        await maybeAdvanceRound(league, match.round);
    }

    await AuditService.record({
        leagueId: league._id,
        guildId: audit.guildId,
        actorId: audit.actorId,
        action: audit.action,
        summary: audit.summary,
        metadata: {
            matchId: updatedMatch._id.toString(),
            round: updatedMatch.round,
            score: updatedMatch.score,
            ...audit.metadata
        }
    });

    return { match: updatedMatch, standing, league };
}

/**
 * @param {object} league
 */
async function maybeCompleteLeague(league) {
    if (league.status === LEAGUE_STATUS.COMPLETED) {
        return;
    }

    if (!league.totalRounds || league.currentRound < league.totalRounds) {
        return;
    }

    const unresolved = await MatchRepository.countUnresolvedInRound(
        league._id,
        league.currentRound,
    );

    if (unresolved > 0) {
        return;
    }

    const updated = await LeagueRepository.updateById(league._id, {
        status: LEAGUE_STATUS.COMPLETED,
    });

    if (updated) {
        league.status = updated.status;

        await AuditService.record({
            leagueId: league._id,
            guildId: league.guildId,
            actorId: 'system',
            action: AUDIT_ACTION.LEAGUE_COMPLETED,
            summary: `League season ${league.season} completed`,
        });

        await TournamentService.bootstrapFromCompletedLeague(updated);
    }
}

/**
 * @param {object} league
 * @param {number} completedRound
 */
async function maybeAdvanceRound(league, completedRound) {
    if (league.currentRound !== completedRound) {
        return;
    }

    const unresolved = await MatchRepository.countUnresolvedInRound(league._id, completedRound);

    if (unresolved > 0) {
        return;
    }

    if (completedRound >= league.totalRounds) {
        await maybeCompleteLeague(league);
        return;
    }

    const nextRound = completedRound + 1;

    if (nextRound === league.currentRound) {
        return;
    }

    const updated = await LeagueRepository.updateById(league._id, { currentRound: nextRound });

    if (updated) {
        league.currentRound = updated.currentRound;
    }
}

/**
 * @param {object} league
 * @param {string} homeName
 * @param {string} awayName
 */
async function resolveTeams(league, homeName, awayName) {
    const [homeTeam, awayTeam] = await Promise.all([
        TeamRepository.findByLeagueAndName(league._id, homeName),
        TeamRepository.findByLeagueAndName(league._id, awayName)
    ]);

    if (!homeTeam?.isActive) {
        throw new LeagueError('TEAM_NOT_FOUND_HOME', { name: homeName });
    }

    if (!awayTeam?.isActive) {
        throw new LeagueError('TEAM_NOT_FOUND_AWAY', { name: awayName });
    }

    return { homeTeam, awayTeam };
}

const MatchService = {
    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {{ homeTeam: string, awayTeam: string, homeGoals: number, awayGoals: number, round?: number }} input
     */
    submitResult: async (guildId, actorId, leagueSlug, input) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanReportScore(league, actorId);

        if (!league.fixtureGeneratedAt) {
            throw new LeagueError('NO_FIXTURE_SCORE');
        }

        const { home, away } = assertDistinctTeams(input.homeTeam, input.awayTeam);
        const { homeTeam, awayTeam } = await resolveTeams(league, home, away);

        const candidates = await MatchRepository.findSubmittableBetweenTeams(
            league._id,
            homeTeam._id,
            awayTeam._id,
            input.round ?? null
        );

        const match = pickUniqueMatch(candidates, {
            round: input.round ?? null,
            actionLabel: 'scheduled match'
        });

        if (!match) {
            const roundHint = input.round ? ` in round ${input.round}` : '';
            throw new LeagueError('MATCH_NOT_FOUND_SCHEDULED', { home, away, roundHint });
        }

        assertSubmittable(match);

        const { homeGoals, awayGoals } = resolveFixtureGoals(
            match,
            homeTeam,
            awayTeam,
            input.homeGoals,
            input.awayGoals
        );

        const update = buildSubmitUpdate({
            match,
            actorId,
            homeGoals,
            awayGoals
        });

        const result = await persistMatchResult(match, update, league, {
            guildId,
            actorId,
            action: AUDIT_ACTION.MATCH_SUBMIT,
            summary: `Result ${input.homeGoals}-${input.awayGoals}: ${home} vs ${away}`
        });

        return result;
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {{ matchId: string, homeGoals: number, awayGoals: number }} input
     */
    submitResultByMatchId: async (guildId, actorId, leagueSlug, input) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanReportScore(league, actorId);

        const match = await MatchRepository.findById(input.matchId);

        if (!match || match.leagueId.toString() !== league._id.toString()) {
            throw new LeagueError('MATCH_NOT_FOUND');
        }

        if (!match.tournamentId && !league.fixtureGeneratedAt) {
            throw new LeagueError('NO_FIXTURE_SCORE');
        }

        assertSubmittable(match);

        const update = buildSubmitUpdate({
            match,
            actorId,
            homeGoals: input.homeGoals,
            awayGoals: input.awayGoals,
        });

        const [homeTeam, awayTeam] = await Promise.all([
            TeamRepository.findById(match.homeTeamId),
            TeamRepository.findById(match.awayTeamId),
        ]);

        const homeName = homeTeam?.name || 'Home';
        const awayName = awayTeam?.name || 'Away';

        const result = await persistMatchResult(match, update, league, {
            guildId,
            actorId,
            action: AUDIT_ACTION.MATCH_SUBMIT,
            summary: `Result ${input.homeGoals}-${input.awayGoals}: ${homeName} vs ${awayName}`,
        });

        return result;
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {{ homeTeam: string, awayTeam: string, homeGoals: number, awayGoals: number, round?: number, reason?: string }} input
     */
    correctResult: async (guildId, actorId, leagueSlug, input) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (!league.fixtureGeneratedAt) {
            throw new LeagueError('NO_FIXTURE_SCORE_CORRECT');
        }

        const { home, away } = assertDistinctTeams(input.homeTeam, input.awayTeam);
        const { homeTeam, awayTeam } = await resolveTeams(league, home, away);

        const candidates = await MatchRepository.findCorrectableBetweenTeams(
            league._id,
            homeTeam._id,
            awayTeam._id,
            input.round ?? null
        );

        const match = pickUniqueMatch(candidates, {
            round: input.round ?? null,
            actionLabel: 'completed match'
        });

        if (!match) {
            const roundHint = input.round ? ` in round ${input.round}` : '';
            throw new LeagueError('MATCH_NOT_FOUND_COMPLETED', { home, away, roundHint });
        }

        assertCorrectable(match);

        const { homeGoals, awayGoals } = resolveFixtureGoals(
            match,
            homeTeam,
            awayTeam,
            input.homeGoals,
            input.awayGoals
        );

        const update = buildCorrectionUpdate({
            match,
            actorId,
            homeGoals,
            awayGoals,
            reason: input.reason
        });

        const result = await persistMatchResult(match, update, league, {
            guildId,
            actorId,
            action: AUDIT_ACTION.MATCH_CORRECT,
            summary: `Corrected to ${input.homeGoals}-${input.awayGoals}: ${home} vs ${away}`,
            metadata: { reason: input.reason || null }
        });

        return result;
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {{ homeTeam: string, awayTeam: string, winnerTeam: string, round?: number }} input
     */
    recordForfeit: async (guildId, actorId, leagueSlug, input) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (!league.fixtureGeneratedAt) {
            throw new LeagueError('NO_FIXTURE_FORFEIT');
        }

        const { home, away } = assertDistinctTeams(input.homeTeam, input.awayTeam);
        const winnerName = input.winnerTeam?.trim();

        if (!winnerName) {
            throw new LeagueError('INVALID_FORFEIT_WINNER');
        }

        const { homeTeam, awayTeam } = await resolveTeams(league, home, away);

        if (![home.toLowerCase(), away.toLowerCase()].includes(winnerName.toLowerCase())) {
            throw new LeagueError('INVALID_FORFEIT_TEAMS');
        }

        const winnerTeam = winnerName.toLowerCase() === home.toLowerCase() ? homeTeam : awayTeam;

        const candidates = await MatchRepository.findSubmittableBetweenTeams(
            league._id,
            homeTeam._id,
            awayTeam._id,
            input.round ?? null
        );

        const match = pickUniqueMatch(candidates, {
            round: input.round ?? null,
            actionLabel: 'scheduled match'
        });

        if (!match) {
            const roundHint = input.round ? ` in round ${input.round}` : '';
            throw new LeagueError('MATCH_NOT_FOUND_SCHEDULED', { home, away, roundHint });
        }

        assertSubmittable(match);

        const fixtureTeamIds = [match.homeTeamId.toString(), match.awayTeamId.toString()];

        if (!fixtureTeamIds.includes(winnerTeam._id.toString())) {
            throw new LeagueError('TEAM_MISMATCH_FORFEIT');
        }

        const update = buildForfeitUpdate({
            match,
            actorId,
            winnerTeamId: winnerTeam._id
        });

        const result = await persistMatchResult(match, update, league, {
            guildId,
            actorId,
            action: AUDIT_ACTION.MATCH_FORFEIT,
            summary: `Forfeit winner: ${winnerName} (${home} vs ${away})`
        });

        return result;
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {{ homeTeam: string, awayTeam: string, round?: number, action: 'postpone' | 'cancel' | 'resume' }} input
     */
    setMatchStatus: async (guildId, actorId, leagueSlug, input) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (!league.fixtureGeneratedAt) {
            throw new LeagueError('NO_FIXTURE_VIEW');
        }

        const action = input.action;
        const allowedFrom = STATUS_ACTION_FROM[action];

        if (!allowedFrom) {
            throw new LeagueError('MATCH_STATUS_NOT_ALLOWED');
        }

        const { home, away } = assertDistinctTeams(input.homeTeam, input.awayTeam);
        const { homeTeam, awayTeam } = await resolveTeams(league, home, away);

        const candidates = await MatchRepository.findBetweenTeams(
            league._id,
            homeTeam._id,
            awayTeam._id,
            allowedFrom,
            input.round ?? null,
        );

        const match = pickUniqueMatch(candidates, {
            round: input.round ?? null,
            actionLabel: 'match',
        });

        if (!match) {
            const roundHint = input.round ? ` in round ${input.round}` : '';
            throw new LeagueError('MATCH_NOT_FOUND_SCHEDULED', { home, away, roundHint });
        }

        const updatedMatch = await MatchRepository.updateWithVersion(
            match._id,
            match.resultVersion ?? 0,
            { status: STATUS_ACTION_TO[action] },
        );

        if (!updatedMatch) {
            throw new LeagueError('CONCURRENT_UPDATE');
        }

        invalidateLeagueRenderCache(league._id.toString());

        const auditAction = action === 'postpone'
            ? AUDIT_ACTION.MATCH_POSTPONE
            : action === 'cancel'
                ? AUDIT_ACTION.MATCH_CANCEL
                : AUDIT_ACTION.MATCH_RESUME;

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: auditAction,
            summary: `${action}: ${home} vs ${away}`,
            metadata: {
                matchId: updatedMatch._id.toString(),
                round: updatedMatch.round,
                status: updatedMatch.status,
            },
        });

        return { match: updatedMatch, league, homeTeam, awayTeam };
    },
};

module.exports = MatchService;