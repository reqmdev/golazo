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
const { resolveTieWinner, isTieResolved, needsPenalties } = require('../tournament/tieResolver');
const PermissionService = require('./PermissionService');
const LeagueService = require('./LeagueService');
const StandingService = require('./StandingService');
const TournamentStandingService = require('./TournamentStandingService');
const AuditService = require('./AuditService');
const { invalidateLeagueRenderCache } = require('../discord/cacheInvalidation');
const { withOperationLock, leagueLockKey } = require('../discord/operationLock');
const { LEAGUE_WRITE_SCOPE } = require('../discord/constants');
const LeagueRepository = require('../repositories/LeagueRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const TournamentStandingRepository = require('../repositories/TournamentStandingRepository');
const MatchRepository = require('../repositories/MatchRepository');
const TeamRepository = require('../repositories/TeamRepository');
const { runWithTransaction } = require('../../database/transactions');

const KNOCKOUT_ROUND_ORDER = ['r16', 'qf', 'sf', 'playoff', 'final'];

/**
 * @param {object} league
 * @param {object | null} tournament
 */
function assertTournamentReadable(league, tournament) {
    if (!league.championsLeague?.enabled) {
        throw new LeagueError('CL_NOT_ENABLED');
    }

    if (!tournament) {
        if (league.status === LEAGUE_STATUS.COMPLETED) {
            throw new LeagueError('CL_NO_TOURNAMENT');
        }

        throw new LeagueError('CL_NOT_ENABLED');
    }
}

/**
 * @param {object} match
 * @param {object} tournament
 */
function assertTournamentMatchCorrectable(match, tournament) {
    if (!match?.tournamentId || !tournament) {
        return;
    }

    if (tournament.status === TOURNAMENT_STATUS.COMPLETED) {
        throw new LeagueError('CL_KNOCKOUT_LOCKED');
    }

    if (match.groupId && tournament.status !== TOURNAMENT_STATUS.GROUP_STAGE) {
        throw new LeagueError('CL_KNOCKOUT_LOCKED');
    }

    if (match.knockoutRound && tournament.currentKnockoutRound) {
        const matchIdx = KNOCKOUT_ROUND_ORDER.indexOf(match.knockoutRound);
        const currentIdx = KNOCKOUT_ROUND_ORDER.indexOf(tournament.currentKnockoutRound);

        if (matchIdx >= 0 && currentIdx >= 0 && matchIdx < currentIdx) {
            throw new LeagueError('CL_KNOCKOUT_LOCKED');
        }
    }
}

/**
 * @param {object} tournament
 */
async function deleteCancelledTournament(tournament) {
    await runWithTransaction(async (session) => {
        await MatchRepository.deleteByTournament(tournament._id, session);
        await TournamentStandingRepository.deleteByTournament(tournament._id, session);
        await TournamentRepository.deleteById(tournament._id, session);
    });
}

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
        Boolean(tournament.format.useBestThirds),
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
    return runWithTransaction(async (session) => {
        const fresh = await TournamentRepository.findById(tournament._id);

        if (!fresh || fresh.status !== TOURNAMENT_STATUS.KNOCKOUT) {
            return fresh || tournament;
        }

        const round = fresh.currentKnockoutRound;
        const matches = await MatchRepository.listByTournament(fresh._id, { knockoutRound: round });
        const unresolved = matches.filter(
            (m) => ['scheduled', 'live', 'postponed'].includes(m.status),
        );

        if (unresolved.length > 0) {
            return fresh;
        }

        /** @type {object[]} */
        const updatedTies = fresh.knockoutTies.map((tie) => {
            if (tie.round !== round) {
                return tie;
            }

            const winnerId = resolveTieWinner(tie, matches);

            return { ...tie, winnerId };
        });

        const roundTies = updatedTies.filter((t) => t.round === round);
        const allResolved = roundTies.every((tie) => isTieResolved(tie, matches));

        if (!allResolved) {
            const pending = roundTies.find((tie) => needsPenalties(tie, matches));

            if (pending) {
                return TournamentRepository.updateById(
                    fresh._id,
                    { knockoutTies: updatedTies },
                    session,
                );
            }

            return TournamentRepository.updateById(
                fresh._id,
                { knockoutTies: updatedTies },
                session,
            );
        }

        if (round === KNOCKOUT_ROUND.PLAYOFF) {
            const playoffWinner = roundTies[0]?.winnerId?.toString();
            const seed1 = roundTies[0]?.awaitsSeed1?.toString();

            if (!playoffWinner || !seed1) {
                return fresh;
            }

            const { tieId, fixtures } = buildFinalFromPlayoff({
                tournamentId: fresh._id.toString(),
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

            const claimed = await TournamentRepository.updateByIdIf(
                fresh._id,
                { currentKnockoutRound: round },
                {
                    currentKnockoutRound: KNOCKOUT_ROUND.FINAL,
                    knockoutTies: [...updatedTies, finalTie],
                },
                session,
            );

            if (!claimed) {
                return TournamentRepository.findById(fresh._id);
            }

            if (fixtures.length > 0) {
                await MatchRepository.bulkInsert(fixtures, session);
            }

            return claimed;
        }

        if (round === KNOCKOUT_ROUND.FINAL) {
            const winnerId = roundTies[0]?.winnerId;

            return TournamentRepository.updateByIdIf(
                fresh._id,
                { currentKnockoutRound: round, status: TOURNAMENT_STATUS.KNOCKOUT },
                {
                    status: TOURNAMENT_STATUS.COMPLETED,
                    winnerTeamId: winnerId,
                    completedAt: new Date(),
                    knockoutTies: updatedTies,
                },
                session,
            ) || fresh;
        }

        const nextRound = nextKnockoutRound(round);

        if (!nextRound) {
            return fresh;
        }

        const winners = roundTies
            .sort((a, b) => a.slot - b.slot)
            .map((t) => t.winnerId?.toString())
            .filter(Boolean);

        const nextTies = buildNextRoundTies(
            roundTies.map((t, i) => ({ ...t, winnerId: winners[i] || t.winnerId })),
            nextRound,
        );

        const mergedTies = [
            ...updatedTies.filter((t) => t.round !== nextRound),
            ...nextTies,
        ];

        const claimed = await TournamentRepository.updateByIdIf(
            fresh._id,
            { currentKnockoutRound: round },
            {
                currentKnockoutRound: nextRound,
                knockoutTies: mergedTies,
            },
            session,
        );

        if (!claimed) {
            return TournamentRepository.findById(fresh._id);
        }

        const fixtures = buildKnockoutFixtures({
            ties: nextTies,
            tournamentId: fresh._id.toString(),
            leagueId: league._id.toString(),
            guildId: league.guildId,
            twoLeggedKnockout: league.championsLeague?.twoLeggedKnockout !== false,
            twoLeggedFinal: league.championsLeague?.twoLeggedFinal === true,
        });

        if (fixtures.length > 0) {
            await MatchRepository.bulkInsert(fixtures, session);
        }

        return claimed;
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

        if (existing?.status === TOURNAMENT_STATUS.CANCELLED) {
            await deleteCancelledTournament(existing);
        }

        const spots = league.championsLeague.qualifyingSpots || 4;
        const { standing } = await StandingService.getStandings(league.guildId, league.slug);
        const qualifiedTeams = buildQualifiedTeams(standing, spots);

        if (qualifiedTeams.length < 2) {
            await LeagueRepository.updateById(league._id, {
                championsLeague: {
                    ...league.championsLeague,
                    lastBootstrapError: 'CL_INSUFFICIENT_TEAMS',
                    lastBootstrapErrorAt: new Date(),
                },
            });

            await AuditService.record({
                leagueId: league._id,
                guildId: league.guildId,
                actorId: 'system',
                action: AUDIT_ACTION.TOURNAMENT_START,
                summary: 'Champions League bootstrap skipped — insufficient teams',
                metadata: { error: 'CL_INSUFFICIENT_TEAMS', qualifiedCount: qualifiedTeams.length },
            });

            return null;
        }

        await LeagueRepository.updateById(league._id, {
            championsLeague: {
                ...league.championsLeague,
                lastBootstrapError: null,
                lastBootstrapErrorAt: null,
            },
        });

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

        let tournament;

        try {
            tournament = await TournamentRepository.create(tournamentData);
        } catch (err) {
            if (err?.code === 11000) {
                return TournamentRepository.findByLeagueAndSeason(league._id, league.season);
            }

            throw err;
        }

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

        if (active) {
            const settingsKeys = ['enabled', 'qualifyingSpots', 'twoLeggedKnockout', 'twoLeggedFinal'];
            const changing = settingsKeys.some((key) => {
                if (input[key] === undefined) {
                    return false;
                }

                const current = league.championsLeague?.[key];

                if (key === 'enabled') {
                    return input.enabled !== current;
                }

                if (key === 'qualifyingSpots') {
                    return input.qualifyingSpots !== (current ?? 4);
                }

                if (key === 'twoLeggedKnockout') {
                    return input.twoLeggedKnockout !== (current ?? true);
                }

                return input.twoLeggedFinal !== (current ?? false);
            });

            if (changing) {
                throw new LeagueError('CL_ALREADY_ACTIVE');
            }
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
        assertTournamentReadable(league, tournament);

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
        assertTournamentReadable(league, tournament);

        const matches = await MatchRepository.listByTournament(tournament._id);

        return { league, tournament, teamMap, matches };
    },

    /**
     * @param {string} guildId
     * @param {string} leagueSlug
     * @param {{ phase?: string, groupId?: string, knockoutRound?: string, round?: number }} [filters]
     */
    getTournamentFixture: async (guildId, leagueSlug, filters = {}) => {
        const { league, tournament } = await TournamentService.getTournamentState(guildId, leagueSlug);
        assertTournamentReadable(league, tournament);

        let matches;

        if (filters.phase === 'knockout'
            || (!filters.phase && tournament.status === TOURNAMENT_STATUS.KNOCKOUT)) {
            matches = await MatchRepository.listByTournament(tournament._id, {
                knockoutRound: filters.knockoutRound || tournament.currentKnockoutRound,
            });
        } else {
            matches = await MatchRepository.listByTournament(tournament._id, {
                groupId: filters.groupId || null,
            });

            if (filters.round) {
                matches = matches.filter((match) => match.round === filters.round);
            }
        }

        return { league, tournament, matches };
    },

    /**
     * @param {object} tournament
     * @param {object} league
     */
    afterTournamentMatch: async (tournament, league) => {
        const lockKey = leagueLockKey(league.guildId, league.slug, LEAGUE_WRITE_SCOPE);
        const updated = await withOperationLock(lockKey, () =>
            maybeAdvanceTournament(tournament, league));

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
            throw new LeagueError('CL_NO_TOURNAMENT');
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
    assertTournamentMatchCorrectable,
    assertTournamentReadable,
};

module.exports = TournamentService;
