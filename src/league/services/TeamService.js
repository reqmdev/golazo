const LeagueError = require('../errors/LeagueError');
const { AUDIT_ACTION } = require('../constants/auditAction');
const { TEAM_EDITABLE_STATUSES } = require('../constants/leagueStatus');
const AuditService = require('./AuditService');
const { MAX_TEAM_NAME_LENGTH, MAX_SHORT_NAME_LENGTH } = require('../constants/defaults');
const PermissionService = require('./PermissionService');
const LeagueService = require('./LeagueService');
const TeamRepository = require('../repositories/TeamRepository');
const { invalidateLeagueRenderCache } = require('../discord/cacheInvalidation');
const { assertValidLogoUrl } = require('../utils/validateLogoUrl');

/**
 * @param {string} name
 */
function normalizeTeamName(name) {
    const trimmed = name?.trim();

    if (!trimmed || trimmed.length < 2) {
        throw new LeagueError('INVALID_TEAM_NAME_MIN');
    }

    if (trimmed.length > MAX_TEAM_NAME_LENGTH) {
        throw new LeagueError('INVALID_TEAM_NAME_MAX', { max: MAX_TEAM_NAME_LENGTH });
    }

    return trimmed;
}

/**
 * @param {string} [shortName]
 * @param {string} teamName
 */
function resolveShortName(shortName, teamName) {
    const value = (shortName?.trim() || teamName.slice(0, 3)).toUpperCase();
    return value.slice(0, MAX_SHORT_NAME_LENGTH);
}

/**
 * @param {string} [color]
 * @param {string} label
 */
function assertHexColor(color, label) {
    if (!color) return;

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        throw new LeagueError('INVALID_COLOR', { label });
    }
}

const TeamService = {
    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {{ name: string, shortName?: string, captainId?: string, roleId?: string, primaryColor?: string, secondaryColor?: string, logoUrl?: string }} input
     */
    addTeam: async (guildId, actorId, leagueSlug, input) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (!TEAM_EDITABLE_STATUSES.includes(league.status)) {
            throw new LeagueError('LEAGUE_LOCKED_TEAMS_ADD');
        }

        if (league.fixtureGeneratedAt) {
            throw new LeagueError('FIXTURE_EXISTS_TEAMS_ADD');
        }

        const activeCount = await TeamRepository.countActiveByLeague(league._id);

        if (activeCount >= league.settings.maxTeams) {
            throw new LeagueError('TEAM_LIMIT_MAX', { max: league.settings.maxTeams });
        }

        const name = normalizeTeamName(input.name);
        const nameLower = name.toLowerCase();
        const logoUrl = assertValidLogoUrl(input.logoUrl);
        assertHexColor(input.primaryColor, 'Primary color');
        assertHexColor(input.secondaryColor, 'Secondary color');

        const duplicate = await TeamRepository.findByLeagueAndName(league._id, name);

        if (duplicate?.isActive) {
            throw new LeagueError('TEAM_EXISTS_NAMED', { name });
        }

        // Re-activate a previously removed team with the same name.
        if (duplicate && !duplicate.isActive) {
            const team = await TeamRepository.updateById(duplicate._id, {
                name,
                nameLower,
                shortName: resolveShortName(input.shortName, name),
                captainId: input.captainId || null,
                roleId: input.roleId || null,
                logoUrl,
                isActive: true,
                colors: {
                    primary: input.primaryColor || duplicate.colors?.primary || '#1a472a',
                    secondary: input.secondaryColor || duplicate.colors?.secondary || '#ffffff'
                }
            });

            await AuditService.record({
                leagueId: league._id,
                guildId,
                actorId,
                action: AUDIT_ACTION.TEAM_ADD,
                summary: `Team re-added: ${team.name}`
            });

            return team;
        }

        try {
            const team = await TeamRepository.create({
                leagueId: league._id,
                guildId,
                name,
                nameLower,
                shortName: resolveShortName(input.shortName, name),
                captainId: input.captainId || null,
                roleId: input.roleId || null,
                logoUrl,
                colors: {
                    primary: input.primaryColor || '#1a472a',
                    secondary: input.secondaryColor || '#ffffff'
                }
            });

            await AuditService.record({
                leagueId: league._id,
                guildId,
                actorId,
                action: AUDIT_ACTION.TEAM_ADD,
                summary: `Team added: ${team.name}`
            });

            return team;
        } catch (err) {
            if (err?.code === 11000) {
                throw new LeagueError('TEAM_EXISTS_NAMED', { name });
            }

            throw err;
        }
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {string} teamName
     */
    removeTeam: async (guildId, actorId, leagueSlug, teamName) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (!TEAM_EDITABLE_STATUSES.includes(league.status)) {
            throw new LeagueError('LEAGUE_LOCKED_TEAMS_REMOVE');
        }

        if (league.fixtureGeneratedAt) {
            throw new LeagueError('FIXTURE_EXISTS_TEAMS_REMOVE');
        }

        const name = normalizeTeamName(teamName);
        const team = await TeamRepository.findByLeagueAndName(league._id, name);

        if (!team || !team.isActive) {
            throw new LeagueError('TEAM_NOT_FOUND_NAME', { name });
        }

        const removed = await TeamRepository.updateById(team._id, { isActive: false });

        await AuditService.record({
            leagueId: league._id,
            guildId,
            actorId,
            action: AUDIT_ACTION.TEAM_REMOVE,
            summary: `Team removed: ${removed.name}`
        });

        return removed;
    },

    /**
     * @param {string} guildId
     * @param {string} actorId
     * @param {string} leagueSlug
     * @param {string} teamName
     * @param {{ newName?: string, shortName?: string, captainId?: string, roleId?: string, primaryColor?: string, secondaryColor?: string, logoUrl?: string }} input
     */
    editTeam: async (guildId, actorId, leagueSlug, teamName, input) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        PermissionService.assertCanManageLeague(league, actorId);

        if (!TEAM_EDITABLE_STATUSES.includes(league.status)) {
            throw new LeagueError('LEAGUE_LOCKED_TEAMS_EDIT');
        }

        const name = normalizeTeamName(teamName);
        const team = await TeamRepository.findByLeagueAndName(league._id, name);

        if (!team || !team.isActive) {
            throw new LeagueError('TEAM_NOT_FOUND_NAME', { name });
        }

        const update = {};

        if (input.newName) {
            const newName = normalizeTeamName(input.newName);

            if (newName !== team.name) {
                const clash = await TeamRepository.findByLeagueAndName(league._id, newName);

                if (clash && clash.isActive) {
                    throw new LeagueError('TEAM_EXISTS_NAMED', { name: newName });
                }

                update.name = newName;
                update.nameLower = newName.toLowerCase();
            }
        }

        if (input.shortName !== undefined) {
            update.shortName = resolveShortName(input.shortName, update.name || team.name);
        }

        if (input.captainId !== undefined) update.captainId = input.captainId || null;
        if (input.roleId !== undefined) update.roleId = input.roleId || null;
        if (input.logoUrl !== undefined) {
            update.logoUrl = assertValidLogoUrl(input.logoUrl);
        }

        assertHexColor(input.primaryColor, 'Primary color');
        assertHexColor(input.secondaryColor, 'Secondary color');

        if (input.primaryColor || input.secondaryColor) {
            update.colors = {
                primary: input.primaryColor || team.colors?.primary || '#1a472a',
                secondary: input.secondaryColor || team.colors?.secondary || '#ffffff'
            };
        }

        if (Object.keys(update).length === 0) {
            throw new LeagueError('NO_CHANGES');
        }

        try {
            const updated = await TeamRepository.updateById(team._id, update);

            invalidateLeagueRenderCache(league._id.toString());
            await AuditService.record({
                leagueId: league._id,
                guildId,
                actorId,
                action: AUDIT_ACTION.TEAM_EDIT,
                summary: `Team edited: ${updated.name}`
            });

            return updated;
        } catch (err) {
            if (err?.code === 11000) {
                throw new LeagueError('TEAM_EXISTS_OTHER');
            }

            throw err;
        }
    },

    /**
     * @param {string} guildId
     * @param {string} leagueSlug
     */
    listTeams: async (guildId, leagueSlug) => {
        const league = await LeagueService.resolveLeague(guildId, leagueSlug);
        return TeamRepository.listActiveByLeague(league._id);
    }
};

module.exports = TeamService;