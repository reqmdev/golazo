const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags, ComponentType } = require('discord.js');
const { encodeDashboardId, parseDashboardId } = require('./ids');
const {
    DASHBOARD_VIEWS,
    HUB_ACTIONS,
    LEAGUE_ACTIONS,
    TEAM_ACTIONS,
    STANDINGS_ACTIONS,
} = require('./constants');
const { encodeDashboardStandingsNavId } = require('./panels/standingsPanel');
const { parsePanelRef, encodePanelRef } = require('./panelBackNav');
const { parseModalSlug } = require('./handlers/modals');
const { MODAL_IDS } = require('./constants');
const { buildDashboardShell } = require('./design/shell');
const { buildViewerContext } = require('./permissions');
const { createTranslator } = require('../i18n');

describe('dashboard', () => {
    const tr = createTranslator('en');

    it('round-trips dashboard custom ids with slug colons', () => {
        const id = encodeDashboardId(DASHBOARD_VIEWS.LEAGUE, LEAGUE_ACTIONS.PANEL, 'super:lig');
        const parsed = parseDashboardId(id);

        assert.equal(parsed?.view, DASHBOARD_VIEWS.LEAGUE);
        assert.equal(parsed?.action, LEAGUE_ACTIONS.PANEL);
        assert.equal(parsed?.slug, 'super:lig');
    });

    it('parses hub ids without slug', () => {
        const id = encodeDashboardId(DASHBOARD_VIEWS.HUB, HUB_ACTIONS.LEAGUE_SELECT);
        const parsed = parseDashboardId(id);

        assert.equal(parsed?.view, DASHBOARD_VIEWS.HUB);
        assert.equal(parsed?.action, HUB_ACTIONS.LEAGUE_SELECT);
        assert.equal(parsed?.slug, null);
    });

    it('builds V2 dashboard payload without embeds', () => {
        const payload = buildDashboardShell({
            view: DASHBOARD_VIEWS.HUB,
            tr,
            title: 'Test',
            body: 'Body',
            footerRole: 'dashboard.roles.viewer',
            includeHero: false,
        });

        assert.equal(payload.flags, MessageFlags.IsComponentsV2);
        assert.equal(payload.embeds.length, 0);
        assert.equal(payload.files.length, 0);
        assert.equal(payload.components.length, 1);

        const container = payload.components[0].toJSON();
        assert.equal(container.type, ComponentType.Container);
        assert.ok(container.components.some((part) => part.type === ComponentType.TextDisplay));
        assert.ok(container.components.some((part) => part.type === ComponentType.Separator));
    });

    it('resolves viewer roles from league permissions', () => {
        const owner = buildViewerContext({
            member: null,
            userId: 'u1',
            league: {
                permissions: {
                    ownerId: 'u1',
                    adminIds: [],
                    scoreReporterIds: [],
                },
            },
        });

        assert.equal(owner.isOwner, true);
        assert.equal(owner.roleKey, 'dashboard.roles.owner');

        const scorer = buildViewerContext({
            member: null,
            userId: 'u2',
            league: {
                permissions: {
                    ownerId: 'u1',
                    adminIds: [],
                    scoreReporterIds: ['u2'],
                },
            },
        });

        assert.equal(scorer.canReportScore, true);
        assert.equal(scorer.roleKey, 'dashboard.roles.scorer');
    });

    it('exposes dashboard i18n keys', () => {
        assert.match(tr('dashboard.hub.title'), /Golazo/);
        assert.match(tr('dashboard.panels.teams.title'), /Teams/);
        assert.match(tr('dashboard.teams.add'), /Add/);
        assert.match(tr('dashboard.matchOps.postpone'), /Postpone/);
    });

    it('parses panel refs with pipe-delimited extras', () => {
        const ref = encodePanelRef('super:lig', 'user1', 'admin', 'add');
        const parsed = parsePanelRef(ref);

        assert.equal(parsed.slug, 'super:lig');
        assert.deepEqual(parsed.extras, ['user1', 'admin', 'add']);
    });

    it('parses slugged modal custom ids', () => {
        const customId = `${MODAL_IDS.ADD_TEAM}:test-lig`;
        assert.equal(parseModalSlug(customId, MODAL_IDS.ADD_TEAM), 'test-lig');
    });

    it('encodes dashboard standings nav ids with page ref', () => {
        const id = encodeDashboardStandingsNavId('super-lig', 2, STANDINGS_ACTIONS.NEXT_PAGE);
        const parsed = parseDashboardId(id);
        const ref = parsePanelRef(parsed.slug);

        assert.equal(parsed?.view, DASHBOARD_VIEWS.STANDINGS);
        assert.equal(parsed?.action, STANDINGS_ACTIONS.NEXT_PAGE);
        assert.equal(ref.slug, 'super-lig');
        assert.equal(ref.extras[0], '2');
    });

    it('encodes team panel action ids', () => {
        const id = encodeDashboardId(DASHBOARD_VIEWS.TEAMS, TEAM_ACTIONS.GENERATE, 'lig-a');
        const parsed = parseDashboardId(id);

        assert.equal(parsed?.view, DASHBOARD_VIEWS.TEAMS);
        assert.equal(parsed?.action, TEAM_ACTIONS.GENERATE);
        assert.equal(parsed?.slug, 'lig-a');
    });
});