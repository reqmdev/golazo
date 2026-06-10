const config = require('../../../config');
const { buildStandingsView } = require('../data/standingsView');
const { buildFixtureView } = require('../data/fixtureView');
const { buildMatchResultView } = require('../data/matchResultView');
const { buildTeamListView } = require('../data/teamListView');
const { createRenderer } = require('../core/RendererFactory');
const { getCachedRender, setCachedRender } = require('../core/RenderCache');
const { hashKey } = require('../utils/hashKey');
const { GRAPHICS_REVISION } = require('../../../graphics/revision');

function renderCacheMeta() {
    return {
        graphicsRevision: GRAPHICS_REVISION,
        renderEngine: config.render?.engine || 'canvas',
        svgCards: config.render?.svgCards || []
    };
}

/** @type {Map<string, Promise<{ buffer: Buffer, filename: string, cached: boolean, meta?: object }>>} */
const inflight = new Map();

/**
 * @param {Map<string, object>} teamMap
 */
function teamsRevision(teamMap) {
    const parts = [...teamMap.values()]
        .map((team) => `${team._id}:${team.name}:${team.updatedAt || ''}:${team.logoUrl || ''}`)
        .sort()
        .join('|');

    return hashKey('teams', parts).slice(9, 21);
}

/**
 * @param {object[]} matches
 */
function scoresFingerprint(matches) {
    const parts = matches
        .map((match) => `${match._id}:${match.status}:${match.score?.home ?? 'x'}-${match.score?.away ?? 'x'}`)
        .join('|');

    return hashKey('scores', parts).slice(9, 21);
}

/**
 * @param {string} namespace
 * @param {object} payload
 * @param {() => Promise<{ buffer: Buffer, filename: string, meta?: object }>} renderFn
 */
async function renderWithCache(namespace, payload, renderFn) {
    const key = hashKey(namespace, payload);
    const cached = getCachedRender(key);

    if (cached) {
        const filename = payload.filename || `${namespace}.png`;
        return {
            buffer: cached,
            filename,
            cached: true,
            meta: payload.meta || {}
        };
    }

    if (inflight.has(key)) {
        return inflight.get(key);
    }

    const promise = (async () => {
        try {
            const result = await renderFn();
            setCachedRender(key, result.buffer, {
                leagueId: payload.leagueId,
                guildId: payload.guildId
            });
            return { ...result, cached: false };
        } finally {
            inflight.delete(key);
        }
    })();

    inflight.set(key, promise);
    return promise;
}

const RenderService = {
    /**
     * @param {object} league
     * @param {object} standing
     * @param {Map<string, object>} teamMap
     * @param {{ page?: number, themeId?: string, useCache?: boolean, locale?: string, tr?: Function }} [options]
     */
    renderStandings: async (league, standing, teamMap, options = {}) => {
        const view = buildStandingsView(league, standing, teamMap, {
            page: options.page,
            tr: options.tr
        });
        const renderer = createRenderer('standings', { themeId: options.themeId });

        const payload = {
            type: 'standings',
            leagueId: view.league.id,
            guildId: league.guildId,
            version: view.meta.version,
            page: view.page,
            rowCount: view.rows.length,
            teamsRevision: teamsRevision(teamMap),
            locale: options.locale || 'en',
            filename: `standings-${view.league.slug}.png`,
            ...renderCacheMeta()
        };

        if (options.useCache === false) {
            return renderer.render(view);
        }

        return renderWithCache('standings', payload, () => renderer.render(view));
    },

    /**
     * @param {object} league
     * @param {number} round
     * @param {object[]} matches
     * @param {Map<string, object>} teamMap
     * @param {string[]} byeTeams
     * @param {{ page?: number, themeId?: string, useCache?: boolean, locale?: string, tr?: Function }} [options]
     */
    renderFixture: async (league, round, matches, teamMap, byeTeams, options = {}) => {
        const view = buildFixtureView(league, round, matches, teamMap, byeTeams, { tr: options.tr });
        view.page = options.page ?? 1;
        const renderer = createRenderer('fixture', { themeId: options.themeId });

        const payload = {
            type: 'fixture',
            leagueId: view.league.id,
            guildId: league.guildId,
            round,
            page: view.page,
            matchCount: view.matchCount,
            fixtureVersion: league.fixtureVersion,
            scoresFingerprint: scoresFingerprint(matches),
            teamsRevision: teamsRevision(teamMap),
            locale: options.locale || 'en',
            filename: `fixture-${view.league.slug}-r${round}.png`,
            ...renderCacheMeta()
        };

        if (options.useCache === false) {
            return renderer.render(view);
        }

        return renderWithCache('fixture', payload, () => renderer.render(view));
    },

    /**
     * @param {object} league
     * @param {object} match
     * @param {Map<string, object>} teamMap
     * @param {{ label?: string, themeId?: string, useCache?: boolean, locale?: string, tr?: Function }} [options]
     */
    renderMatchResult: async (league, match, teamMap, options = {}) => {
        const view = buildMatchResultView(league, match, teamMap, {
            label: options.label,
            tr: options.tr
        });
        const renderer = createRenderer('match_result', { themeId: options.themeId });

        const payload = {
            type: 'match_result',
            leagueId: league._id?.toString(),
            guildId: league.guildId,
            matchId: view.match.id,
            resultVersion: match.resultVersion ?? 0,
            score: view.match.scoreText,
            locale: options.locale || 'en',
            filename: `result-${view.league.slug}.png`,
            ...renderCacheMeta()
        };

        if (options.useCache === false) {
            return renderer.render(view);
        }

        return renderWithCache('match_result', payload, () => renderer.render(view));
    },

    /**
     * @param {object} league
     * @param {object[]} teams
     * @param {{ page?: number, themeId?: string, useCache?: boolean, locale?: string, tr?: Function, captainLabels?: Map<string, string>, roleLabels?: Map<string, string> }} [options]
     */
    renderTeamList: async (league, teams, options = {}) => {
        const view = buildTeamListView(league, teams, {
            page: options.page,
            tr: options.tr,
            captainLabels: options.captainLabels,
            roleLabels: options.roleLabels
        });
        const renderer = createRenderer('team_list', { themeId: options.themeId });

        const teamsFingerprint = teams
            .map((team) => `${team._id}:${team.name}:${team.updatedAt || ''}:${team.captainId || ''}:${team.roleId || ''}`)
            .sort()
            .join('|');

        const payload = {
            type: 'team_list',
            leagueId: view.league.id,
            guildId: league.guildId,
            page: view.page,
            rowCount: view.rows.length,
            teamsFingerprint: hashKey('team-list', teamsFingerprint).slice(9, 21),
            locale: options.locale || 'en',
            filename: `teams-${view.league.slug}.png`,
            ...renderCacheMeta()
        };

        if (options.useCache === false) {
            return renderer.render(view);
        }

        return renderWithCache('team_list', payload, () => renderer.render(view));
    },

    /**
     * @param {{ buffer: Buffer, filename: string }} renderResult
     */
    toDiscordAttachment(renderResult) {
        const BaseRenderer = require('../renderers/BaseRenderer');
        return BaseRenderer.toAttachment(renderResult.buffer, renderResult.filename);
    }
};

module.exports = RenderService;