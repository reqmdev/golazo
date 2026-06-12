const LeagueError = require('../errors/LeagueError');
const { AUDIT_ACTION } = require('../constants/auditAction');
const { LEAGUE_STATUS } = require('../constants/leagueStatus');
const { TOURNAMENT_STATUS, TOURNAMENT_TYPE, TOURNAMENT_PHASE } = require('../constants/tournamentStatus');
const { KNOCKOUT_ROUND, nextKnockoutRound } = require('../constants/knockoutRound');
const { resolveFormat } = require('../tournament/formatResolver');
const { performGroupDraw } = require('../tournament/groupDraw');
const { buildGroupFixtures, getMaxGroupRounds } = require('../tournament/groupFixture');
const { resolveGroupQualifiers } = require('../tournament/groupStandingCalculator');
const {
    buildKnockoutBracket,
    buildPlayoffBracket,
    seedKnockoutFromGroups,
    buildNextRoundTies,
} = require('../tournament/knockoutBracket');
const { buildKnockoutFixtures, buildFinalFromPlayoff } = require('../tournament/knockoutFixture');
const { resolveTieWinner, isTieResolved } = require('../tournament/tieResolver');
const PermissionService = require('./PermissionService');
const LeagueService = require('./LeagueService');
const StandingService = require('./StandingService');
const TournamentStandingService = require('./TournamentStandingService');
const AuditService = require('./AuditService');
const { invalidateLeagueRenderCache } = require('../discord/cacheInvalidation');
const LeagueRepository = require('../repositories/LeagueRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const TournamentStandingRepository = require('../repositories/TournamentStandingRepository');
const MatchRepository = require('../repositories/MatchRepository');
const TeamRepository = require('../repositories/TeamRepository');
const { runWithTransaction } = require('../../database/transactions');

/**
 * @param {object} league
 * @param {object} standing
 * @param {number} spots
 */
function buildQualifiedTeams(standing, spots) {
    if (!standing?.entries?.length) {
        return [];
    }

    const sorted = [...standing.entries].sort((a, b) => a.rank - b.rank);
    const picks = sorted.slice(0, spots);

    return picks.map((entry, index) => ({
        teamId: entry.teamId,
        leagueRank: entry.rank,
        seed: index + 1,
    }));
}

/**
 * @param {object} tournament
 * @param {object} league
 */
async function startKnockoutPhase(tournament, league) {
    const matches = await MatchRepository.listByTournament(tournament._id);
    const groupStandings = await TournamentStandingService.getGroupStandings(tournament._id);

    const qualifiers = resolveGroupQualifiers(
        groupStandings.map((s) => ({ groupId: s.groupId, entries: s.entries })),
        tournament.format.qualifiersPerGroup,
        tournament.format.knockoutSize,
    );

    const round = tournament.format.initialKnockoutRound || KNOCKOUT_ROUND.QF;
    const ties = seedKnockoutFromGroups(qualifiers, round);
    const fixtures = buildKnockoutFixtures({
        ties,
        tournamentId: tournament._id.toString(),
        leagueId: league._id.toString(),
        guildId: league.guildId,
        twoLeggedKnockout: league.championsLeague?.twoLeggedKnockout !== false,
        twoLeggedFinal: league.championsLeague?.twoLeggedFinal === true,
    });

    if (fixtures.length > 0) {
        await MatchRepository.bulkInsert(fixtures);
    }

    return TournamentRepository.updateById(tournament._id, {
        status: TOURNAMENT_STATUS.KNOCKOUT,
        currentPhase: TOURNAMENT_PHASE.KNOCKOUT,
        currentKnockoutRound: round,
        knockoutTies: ties,
    });
}

/**
 * @param {object} tournament
 * @param {object} league
 */
async function maybeAdvanceTournament(tournament, league) {
    if (tournament.status === TOURNAMENT_STATUS.GROUP_STAGE) {
        const allMatches = await MatchRepository.listByTournament(tournament._id);
        const groupMatches = allMatches.filter((m) => m.groupId);
        const unresolved = groupMatches.filter(
            (m) => ['scheduled', 'live', 'postponed'].includes(m.status),
        );

        if (unresolved.length > 0) {
            return tournament;
        }

        await TournamentStandingService.recalculateAllGroups(
            tournament._id,
            league,
            tournament.groups,
        );

        return startKnockoutPhase(tournament, league);
    }

    if (tournament.status === TOURNAMENT_STATUS.KNOCKOUT) {
        return maybeAdvanceKnockout(tournament, league);
    }

    return tournament;
}

/**
 * @param {object} tournament
 * @param {object} league
 */
async function maybeAdvanceKnockout(tournament, league) {
    const round = tournament.currentKnockoutRound;
    const matches = await MatchRepository.listByTournament(tournament._id, { knockoutRound: round });
    const unresolved = matches.filter(
        (m) => ['scheduled', 'live', 'postponed'].includes(m.status),
    );

    if (unresolved.length > 0) {
        return tournament;
    }

    /** @type {object[]} */
    const updatedTies = tournament.knockoutTies.map((tie) => {
        if (tie.round !== round) {
            return tie;
        }

        const winnerId = resolveTieWinner(tie, matches);

        return { ...tie, winnerId };
    });

    const roundTies = updatedTies.filter((t) => t.round === round);
    const allResolved = roundTies.every((tie) => isTieResolved(tie, matches));

    if (!allResolved) {
        return TournamentRepository.updateById(tournament._id, { knockoutTies: updatedTies });
    }

    if (round === KNOCKOUT_ROUND.PLAYOFF) {
        const playoffWinner = roundTies[0]?.winnerId?.toString();
        const seed1 = roundTies[0]?.awaitsSeed1?.toString();

        if (!playoffWinner || !seed1) {
            return tournament;
        }

        const { tieId, fixtures } = buildFinalFromPlayoff({
            tournamentId: tournament._id.toString(),
            leagueId: league._id.toString(),
            guildId: league.guildId,
            teamAId: seed1,
            teamBId: playoffWinner,
            twoLeggedFinal: league.championsLeague?.twoLeggedFinal === true,
        });

        const finalTie = {
            tieId,
            round: KNOCKOUT_ROUND.FINAL,
            slot: 0,
            teamAId: seed1,
            teamBId: playoffWinner,
            winnerId: null,
            isBye: false,
        };

        await MatchRepository.bulkInsert(fixtures);

        return TournamentRepository.updateById(tournament._id, {
            currentKnockoutRound: KNOCKOUT_ROUND.FINAL,
            knockoutTies: [...updatedTies, finalTie],
        });
    }

    if (round === KNOCKOUT_ROUND.FINAL) {
        const winnerId = roundTies[0]?.winnerId;

        return TournamentRepository.updateById(tournament._id, {
            status: TOURNAMENT_STATUS.COMPLETED,
            winnerTeamId: winnerId,
            completedAt: new Date(),
            knockoutTies: updatedTies,
        });
    }

    const nextRound = nextKnockoutRound(round);

    if (!nextRound) {
        return tournament;
    }

    const winners = roundTies
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.winnerId?.toString())
        .filter(Boolean);

    const nextTies = buildNextRoundTies(
        roundTies.map((t, i) => ({ ...t, winnerId: winners[i] || t.winnerId })),
        nextRound,
    );

    const fixtures = buildKnockoutFixtures({
        ties: nextTies,
        tournamentId: tournament._id.toString(),
        leagueId: league._id.toString(),
        guildId: league.guildId,
        twoLeggedKnockout: league.championsLeague?.twoLeggedKnockout !== false,
        twoLeggedFinal: league.championsLeague?.twoLeggedFinal === true,
    });

    if (fixtures.length > 0) {
        await MatchRepository.bulkInsert(fixtures);
    }

    return TournamentRepository.updateById(tournament._id, {
        currentKnockoutRound: nextRound,
        knockoutTies: [...updatedTies.filter((t) => t.round !== nextRound), ...nextTies],
    });
}

const TournamentService = {
    /**
     * @param {object} league
     */
    bootstrapFromCompletedLeague: async (league) => {
        if (!league.championsLeague?.enabled) {
            return null;
        }

        const existing = await TournamentRepository.findByLeagueAndSeason(league._id, league.season);

        if (existing && existing.status !== TOURNAMENT_STATUS.CANCELLED) {
            return existing;
        }

        const spots = league.championsLeague.qualifyingSpots || 4;
        const { standing } = await StandingService.getStandings(league.guildId, league.slug);
        const qualifiedTeams = buildQualifiedTeams(standing, spots);

        if (qualifiedTeams.length < 2) {
            return null;
        }

        const format = resolveFormat(qualifiedTeams.length);
        /** @type {object} */
        let tournamentData = {
            leagueId: league._id,
            guildId: league.guildId,
            season: league.season,
            type: TOURNAMENT_TYPE.CHAMPIONS_LEAGUE,
            status: TOURNAMENT_STATUS.PENDING,
            format,
            qualifiedTeams,
        };

        if (format.skipGroupStage) {
            if (format.templateId === 'playoff_final') {
                const ties = buildPlayoffBracket(qualifiedTeams);
                tournamentData = {
                    ...tournamentData,
                    status: TOURNAMENT_STATUS.KNOCKOUT,
                    currentPhase: TOURNAMENT_PHASE.KNOCKOUT,
                    currentKnockoutRound: KNOCKOUT_ROUND.PLAYOFF,
                    knockoutTies: ties,
                };
            } else {
                const teamIds = qualifiedTeams.map((t) => t.teamId.toString());
                const ties = buildKnockoutBracket({
                    teamIds,
                    round: format.initialKnockoutRound,
                    twoLegged: league.championsLeague?.twoLeggedKnockout !== false,
                });
                tournamentData = {
                    ...tournamentData,
                    status: TOURNAMENT_STATUS.KNOCKOUT,
                    currentPhase: TOURNAMENT_PHASE.KNOCKOUT,
                    currentKnockoutRound: format.initialKnockoutRound,
                    knockoutTies: ties,
                };
            }
        } else {
            const groups = performGroupDraw(qualifiedTeams, format.groupCount);
            tournamentData = {
                ...tournamentData,
                status: TOURNAMENT_STATUS.GROUP_STAGE,
                currentPhase: TOURNAMENT_PHASE.GROUP,
                groups,
                currentGroupRound: 1,
            };
        }

        const tournament = await TournamentRepository.create(tournamentData);

        if (tournament.status === TOURNAMENT_STATUS.GROUP_STAGE) {
            const fixtures = buildGroupFixtures({
                tournamentId: tournament._id.toString(),
                leagueId: league._id.toString(),
                guildId: league.guildId,
                groups: tournament.groups,
            });

            if (fixtures.length > 0) {
                await MatchRepository.bulkInsert(fixtures);
            }

            await TournamentStandingService.recalculateAllGroups(
                tournament._id,
                league,
                tournament.groups,
            );
        } else if (tournament.knockoutTies?.length) {
            const fixtures = buildKnockoutFixtures({
                ties: tournament.knockoutTies,
                tournamentId: tournament._id.toString(),
                leagueId: league._id.toString(),
                guildId: league.guildId,
                twoLeggedKnockout: league.championsLeague?.twoLeggedKnockout !== false,
                twoLeggedFinal: league.championsLeague?.twoLeggedFinal === true,
            });

            if (fixtures.length > 0) {
                await MatchRepository.bulkInsert(fixtures);
            }
        }

        await AuditService.record({
            leagueId: league._id,
            guildId: league.guildId,
            actorId: 'system',
            action: AUDIT_ACTION.TOURNAMENT_START,
            summary: `Champions League started with ${qualifiedTeams.length} teams (${format.templateId})`,
            metadata: { tournamentId: tournament._id.toString(), format: format.templateId },
        });

        invalidateLeagueRenderCache(league._id.toString());

        return tournament;
    },

    /**
     * @param {string} guildId
     * @param {string} leagueSlug
     */
    getTournamentState: async (guildId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        const tournament = await TournamentRepository.findLatestByLeague(league._id);

        if (!tournament) {
            const preview = league.championsLeague?.enabled
                ? await StandingService.getStandings(guildId, leagueSlug)
                : null;

            return {
                league,
                tournament: null,
                qualifiedPreview: preview?.standing
                    ? buildQualifiedTeams(
                        preview.standing,
                        league.championsLeague?.qualifyingSpots || 4,
                    )
                    : [],
            };
        }

        const teams = await TeamRepository.listActiveByLeague(league._id);
        const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));

        return { league, tournament, teamMap };
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {{ enabled?: boolean, qualifyingSpots?: number, twoLeggedKnockout?: boolean, twoLeggedFinal?: boolean }} input
     */
    updateChampionsLeagueSettings: async (guildId, actorId, leagueSlug, input) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        const active = await TournamentRepository.findActiveByLeague(league._id);

        if (active && input.enabled === false) {
            throw new LeagueError('CL_ALREADY_ACTIVE');
        }

        if (input.qualifyingSpots !== undefined) {
            const spots = input.qualifyingSpots;

            if (!Number.isInteger(spots) || spots < 2 || spots > 16) {
                throw new LeagueError('CL_INVALID_SPOTS');
            }
        }

        const championsLeague = {
            enabled: league.championsLeague?.enabled ?? false,
            qualifyingSpots: league.championsLeague?.qualifyingSpots ?? 4,
            twoLeggedKnockout: league.championsLeague?.twoLeggedKnockout ?? true,
            twoLeggedFinal: league.championsLeague?.twoLeggedFinal ?? false,
            ...input,
        };

        const updated = await LeagueRepository.updateById(league._id, { championsLeague });

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.CL_SETTINGS_UPDATE,
            summary: `Champions League settings updated (enabled: ${championsLeague.enabled})`,
            metadata: { championsLeague },
        });

        return updated;
    },

    /**
     * @param {string} guildId
     * @param {string} leagueSlug
     */
    getGroupStandings: async (guildId, leagueSlug) => {
        const { league, tournament } = await TournamentService.getTournamentState(guildId, leagueSlug);

        if (!tournament) {
            throw new LeagueError('CL_NOT_ENABLED');
        }

        const standings = await TournamentStandingService.getGroupStandings(tournament._id);

        return { league, tournament, standings };
    },

    /**
     * @param {string} guildId
     * @param {string} leagueSlug
     */
    getKnockoutBracket: async (guildId, leagueSlug) => {
        const { league, tournament, teamMap } = await TournamentService.getTournamentState(
            guildId,
            leagueSlug,
        );

        if (!tournament) {
            throw new LeagueError('CL_NOT_ENABLED');
        }

        const matches = await MatchRepository.listByTournament(tournament._id);

        return { league, tournament, teamMap, matches };
    },

    /**
     * @param {object} tournament
     * @param {object} league
     */
    afterTournamentMatch: async (tournament, league) => {
        const updated = await maybeAdvanceTournament(tournament, league);

        if (updated?.status === TOURNAMENT_STATUS.COMPLETED) {
            await AuditService.record({
                leagueId: league._id,
                guildId: league.guildId,
                actorId: 'system',
                action: AUDIT_ACTION.TOURNAMENT_COMPLETE,
                summary: `Champions League completed — winner ${updated.winnerTeamId}`,
                metadata: { tournamentId: updated._id.toString() },
            });
        }

        invalidateLeagueRenderCache(league._id.toString());

        return updated;
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     */
    cancelTournament: async (guildId, actorId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);

        if (!PermissionService.isOwner(league, actorId)) {
            PermissionService.assertCanManageLeague(league, actorId);
        }

        const tournament = await TournamentRepository.findActiveByLeague(league._id);

        if (!tournament) {
            throw new LeagueError('CL_NOT_ENABLED');
        }

        await runWithTransaction(async (session) => {
            await MatchRepository.deleteByTournament(tournament._id, session);
            await TournamentStandingRepository.deleteByTournament(tournament._id, session);
            await TournamentRepository.updateById(
                tournament._id,
                { status: TOURNAMENT_STATUS.CANCELLED },
                session,
            );
        });

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.TOURNAMENT_CANCEL,
            summary: 'Champions League cancelled',
        });

        invalidateLeagueRenderCache(league._id.toString());

        return { league, tournament };
    },

    deleteByLeague: async (leagueId, session = null) => {
        await MatchRepository.deleteTournamentByLeague(leagueId, session);
        const tournaments = await TournamentRepository.listByLeague(leagueId);

        for (const tournament of tournaments) {
            await TournamentStandingRepository.deleteByTournament(tournament._id, session);
        }

        return TournamentRepository.deleteByLeague(leagueId, session);
    },

    maybeAdvanceTournament,
    maybeAdvanceKnockout,
};

module.exports = TournamentService;
