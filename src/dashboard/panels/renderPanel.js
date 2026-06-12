const { DASHBOARD_VIEWS } = require('../constants');
const { buildTeamsPanelPayload } = require('./teamsPanel');
const { buildFixturePanelPayload } = require('./fixturePanel');
const { buildScorePanelPayload } = require('./scorePanel');
const { buildStandingsPanelPayload } = require('./standingsPanel');
const { buildSettingsPanelPayload } = require('./settingsPanel');
const { buildMatchOpsPanelPayload } = require('./matchOpsPanel');
const { buildAdminPanelPayload } = require('./adminPanel');
const { buildChampionsPanelPayload } = require('./championsPanel');

/**
 * @param {object} input
 * @param {string} input.panel
 * @param {string} input.guildId
 * @param {string} input.slug
 * @param {import('discord.js').Guild} input.guild
 * @param {import('discord.js').GuildMember | import('discord.js').APIInteractionGuildMember | null} input.member
 * @param {string} input.userId
 * @param {(key: string, params?: Record<string, string | number>) => string} input.tr
 * @param {string} input.locale
 * @param {import('../../client/DiscordBot')} input.client
 * @param {object} [input.options]
 */
async function renderPanelPayload(input) {
    const {
        panel,
        guildId,
        slug,
        guild,
        member,
        userId,
        tr,
        locale,
        client,
        options = {},
    } = input;

    const base = {
        guildId,
        slug,
        guild,
        member,
        userId,
        tr,
        locale,
        client,
        ...options,
    };

    switch (panel) {
        case DASHBOARD_VIEWS.TEAMS:
            return buildTeamsPanelPayload(base);
        case DASHBOARD_VIEWS.FIXTURE:
            return buildFixturePanelPayload(base);
        case DASHBOARD_VIEWS.SCORE:
            return buildScorePanelPayload(base);
        case DASHBOARD_VIEWS.STANDINGS:
            return buildStandingsPanelPayload(base);
        case DASHBOARD_VIEWS.SETTINGS:
            return buildSettingsPanelPayload(base);
        case DASHBOARD_VIEWS.MATCH_OPS:
            return buildMatchOpsPanelPayload(base);
        case DASHBOARD_VIEWS.ADMIN:
            return buildAdminPanelPayload(base);
        case DASHBOARD_VIEWS.CHAMPIONS:
            return buildChampionsPanelPayload(base);
        default:
            throw new Error(`Unknown dashboard panel: ${panel}`);
    }
}

module.exports = {
    renderPanelPayload,
};