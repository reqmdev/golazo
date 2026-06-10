const { DASHBOARD_VIEWS } = require('../constants');
const {
    DASHBOARD_VIEW_EMOJI_KEYS,
    DASHBOARD_VIEW_TITLE_KEYS,
} = require('./tokens');
const { formatBreadcrumbLine } = require('./layout');
const { buildInfoLine, buildInfoBlock } = require('./typography');

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {string} guildName
 * @param {string} [slug]
 * @param {import('./layout').EmojiBudget} budget
 */
function buildDashboardBreadcrumb(tr, guildName, slug, budget) {
    const segments = [];

    const hubEmoji = budget.takeLiteral('🏠');
    segments.push({
        emoji: hubEmoji,
        text: tr('dashboard.design.breadcrumb.hub'),
    });

    if (slug) {
        const leagueEmoji = budget.take('code');
        segments.push({
            emoji: leagueEmoji,
            text: tr('dashboard.design.breadcrumb.league', { slug }),
        });
    } else if (guildName) {
        segments.push({ text: guildName });
    }

    return formatBreadcrumbLine(segments);
}

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {string} view
 * @param {string} [titleOverride]
 */
function resolvePanelTitle(tr, view, titleOverride) {
    if (titleOverride) {
        return titleOverride;
    }

    const key = DASHBOARD_VIEW_TITLE_KEYS[view];

    if (key) {
        return tr(key);
    }

    return tr('dashboard.panels.unknown');
}

/**
 * @param {string} view
 */
function resolvePanelEmojiKey(view) {
    return DASHBOARD_VIEW_EMOJI_KEYS[view] ?? 'brand';
}

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {string} format
 */
function resolveLeagueFormatLabel(tr, format) {
    if (!format) {
        return '';
    }

    const key = `dashboard.league.format.${format}`;
    const label = tr(key);

    return label.startsWith('dashboard.') ? format : label;
}

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {object} league
 * @param {number} teamCount
 * @param {import('./layout').EmojiBudget} budget
 */
function buildLeagueInfoBlock(tr, league, teamCount, budget) {
    const status = tr(`dashboard.league.status.${league.status}`, { status: league.status });
    const roundValue = league.fixtureGeneratedAt
        ? `${league.currentRound || 1}/${league.totalRounds || '?'}`
        : tr('dashboard.hub.leagueNoFixture');

    return buildInfoBlock([
        buildInfoLine(
            budget,
            ['🏆', { key: 'league' }],
            tr('dashboard.design.labels.league'),
            league.name,
        ),
        buildInfoLine(
            budget,
            ['👥', { key: 'team' }],
            tr('dashboard.design.labels.teams'),
            String(teamCount),
        ),
        buildInfoLine(
            budget,
            ['📅', { key: 'fixture' }],
            tr('dashboard.design.labels.round'),
            roundValue,
        ),
        buildInfoLine(
            budget,
            [statusEmoji(league.status)],
            tr('dashboard.design.labels.status'),
            status,
        ),
        buildInfoLine(
            budget,
            ['📋', { key: 'standings' }],
            tr('dashboard.design.labels.format'),
            resolveLeagueFormatLabel(tr, league.format),
        ),
    ]);
}

/** @deprecated Use buildLeagueInfoBlock */
function buildLeagueHubSummaryBlock(tr, league, teamCount, budget) {
    return buildLeagueInfoBlock(tr, league, teamCount, budget);
}

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {object} league
 * @param {number} teamCount
 */
function buildLeagueStatStrip(tr, league, teamCount) {
    const status = tr(`dashboard.league.status.${league.status}`, { status: league.status });
    const roundValue = league.fixtureGeneratedAt
        ? `${league.currentRound || 1}/${league.totalRounds || 1}`
        : '—';

    return [
        {
            emojiKeys: ['team'],
            label: tr('dashboard.design.stats.teams'),
            value: String(teamCount),
        },
        {
            emojiKeys: ['fixture', 'page', 'cooldown'],
            label: tr('dashboard.design.stats.round'),
            value: roundValue,
        },
        {
            emojiLiteral: statusEmoji(league.status),
            label: tr('dashboard.design.stats.status'),
            value: status,
        },
        {
            emojiKeys: ['standings', 'page'],
            label: tr('dashboard.design.stats.format'),
            value: resolveLeagueFormatLabel(tr, league.format),
        },
    ];
}

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {number} count
 * @param {number} max
 */
function buildHubStatStrip(tr, count, max) {
    return [
        {
            emojiKeys: ['league', 'standings'],
            label: tr('dashboard.design.stats.leagues'),
            value: `${count}/${max}`,
        },
    ];
}

/**
 * @param {string} status
 */
function statusEmoji(status) {
    switch (status) {
        case 'active':
            return '🟢';
        case 'registration':
            return '📝';
        case 'completed':
            return '🏁';
        case 'archived':
            return '📦';
        default:
            return '⚪';
    }
}

/**
 * @param {object} input
 */
function buildPanelChrome(input) {
    const {
        view,
        tr,
        slug,
        guildName,
        league,
        teamCount,
        footerRole,
        callout,
        calloutTone,
        hint,
        hintTone,
        title,
    } = input;

    const panelTitle = title ?? resolvePanelTitle(tr, view);
    const resolvedTeamCount = teamCount ?? 0;

    return {
        view,
        tr,
        title: panelTitle,
        guildName: guildName || '',
        slug,
        chromeBuilder: league
            ? (budget) => buildLeagueInfoBlock(tr, league, resolvedTeamCount, budget)
            : undefined,
        footerRole,
        hint: hint ?? callout,
        hintTone: hintTone ?? calloutTone,
    };
}

module.exports = {
    buildDashboardBreadcrumb,
    resolvePanelTitle,
    resolvePanelEmojiKey,
    resolveLeagueFormatLabel,
    buildLeagueInfoBlock,
    buildLeagueHubSummaryBlock,
    buildLeagueStatStrip,
    buildHubStatStrip,
    buildPanelChrome,
    statusEmoji,
    DASHBOARD_VIEWS,
};