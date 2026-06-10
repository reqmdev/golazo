const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ComponentType } = require('discord.js');
const { createTranslator } = require('../../i18n');
const { DASHBOARD_VIEWS } = require('../constants');
const { DASHBOARD_VIEW_ACCENTS } = require('./tokens');
const {
    createEmojiBudget,
} = require('./layout');
const { buildLeagueInfoBlock, resolveLeagueFormatLabel } = require('./context');
const { buildDashboardShell, splitLeagueContainerParts } = require('./shell');
const { buildScoreEntryV2Reply } = require('../../league/utils/visualV2Reply');
const { buildTable, buildStatsTable, measureWidth, padCell } = require('./table');
const { buildControlHint } = require('./typography');
const { buildLeagueTable } = require('../views/guildHub');
const { buildPanelTable } = require('../views/leagueHub');
const { buildDashboardBackRow } = require('../panelBackNav');

const MOCK_HERO = {
    buffer: Buffer.from('png'),
    filename: 'dashboard-hero-mock.png',
};

describe('dashboard design', () => {
    const tr = createTranslator('en');

    it('assigns distinct accents per view', () => {
        assert.notEqual(
            DASHBOARD_VIEW_ACCENTS[DASHBOARD_VIEWS.TEAMS],
            DASHBOARD_VIEW_ACCENTS[DASHBOARD_VIEWS.SCORE],
        );
        assert.ok(DASHBOARD_VIEW_ACCENTS[DASHBOARD_VIEWS.HUB] > 0);
    });

    it('renders league stats as inline strip without code-block divider', () => {
        const budget = createEmojiBudget(tr);
        const line = buildStatsTable([
            { emojiKeys: ['league'], label: 'leagues', value: '1/10' },
        ], budget);

        assert.match(line, /\*\*1\/10\*\*/);
        assert.match(line, /leagues/);
        assert.doesNotMatch(line, /```/);
        assert.doesNotMatch(line, /─/);
    });

    it('renders league list as code-block table', () => {
        const budget = createEmojiBudget(tr);
        const body = buildLeagueTable([
            {
                name: 'Super Lig',
                slug: 'super-lig',
                status: 'active',
                fixtureGeneratedAt: new Date(),
                currentRound: 3,
                totalRounds: 10,
            },
        ], tr, budget);

        assert.match(body, /```/);
        assert.match(body, /Your leagues/);
        assert.match(body, /1\/10/);
        assert.match(body, /Status.*Name/);
        assert.match(body, /🟢/);
        assert.match(body, /super-lig/);
    });

    it('renders panel list as code-block table', () => {
        const budget = createEmojiBudget(tr);
        const body = buildPanelTable(tr, budget);

        assert.match(body, /```/);
        assert.match(body, /👥/);
        assert.match(body, /Register and manage squads/);
    });

    it('renders league format as readable label', () => {
        assert.equal(
            resolveLeagueFormatLabel(tr, 'single_round_robin'),
            'Single round-robin',
        );
        assert.equal(
            resolveLeagueFormatLabel(tr, 'double_round_robin'),
            'Double round-robin',
        );
    });

    it('composes shell with league count in table title and table body', () => {
        const payload = buildDashboardShell({
            view: DASHBOARD_VIEWS.HUB,
            tr,
            title: 'Hub',
            bodyBuilder: (budget) => buildLeagueTable([
                {
                    name: 'Super Lig',
                    slug: 'super-lig',
                    status: 'active',
                    fixtureGeneratedAt: new Date(),
                    currentRound: 1,
                    totalRounds: 10,
                },
            ], tr, budget),
        });

        const textParts = payload.components[0].toJSON().components
            .filter((part) => part.type === ComponentType.TextDisplay)
            .map((part) => part.content);
        const joined = textParts.join('\n');

        assert.match(joined, /1\/10/);
        assert.doesNotMatch(joined, /lig\n─/);
        assert.match(joined, /```/);
        assert.doesNotMatch(joined, /\*\*1\/10\*\* leagues/);
    });

    it('renders league info lines as emoji label value stack', () => {
        const budget = createEmojiBudget(tr);
        const summary = buildLeagueInfoBlock(tr, {
            name: 'Fake Lig',
            status: 'active',
            fixtureGeneratedAt: new Date(),
            currentRound: 2,
            totalRounds: 7,
            format: 'single_round_robin',
        }, 8, budget);

        assert.match(summary, /🏆\s+\*\*League:\*\* Fake Lig/);
        assert.match(summary, /👥\s+\*\*Teams:\*\* 8/);
        assert.match(summary, /📅\s+\*\*Round:\*\* 2\/7/);
        assert.match(summary, /🟢\s+\*\*Status:\*\* Active/);
        assert.match(summary, /📋\s+\*\*Format:\*\* Single round-robin/);
        assert.doesNotMatch(summary, /single_round_robin/);
        assert.equal(summary.split('\n').length, 5);
    });

    it('places hints above controls and back nav in the same container', () => {
        const budget = createEmojiBudget(tr);
        const payload = buildDashboardShell({
            view: DASHBOARD_VIEWS.LEAGUE,
            tr,
            title: 'Test League',
            hint: tr('dashboard.league.hintActive'),
            footerRole: 'dashboard.roles.owner',
            guildName: 'Guild',
            slug: 'slug',
            chromeBuilder: (b) => buildLeagueInfoBlock(tr, {
                name: 'Fake Lig',
                status: 'active',
                fixtureGeneratedAt: new Date(),
                currentRound: 2,
                totalRounds: 7,
                format: 'single_round_robin',
            }, 8, b),
            bodyBuilder: (b) => buildPanelTable(tr, b),
            actionRows: [],
            externalActionRows: [buildDashboardBackRow(tr, 'slug')],
            skipContentSeparator: true,
        });

        assert.equal(payload.components.length, 1);

        const containerParts = payload.components[0].toJSON().components;
        const actionRows = containerParts.filter((part) => part.type === ComponentType.ActionRow);
        assert.equal(actionRows.length, 1);
        assert.equal(actionRows[0].components.length, 2);
        const textParts = containerParts
            .filter((part) => part.type === ComponentType.TextDisplay)
            .map((part) => part.content);
        const hintPart = textParts.find((content) => content.includes('Score'));

        assert.ok(hintPart);
        assert.doesNotMatch(hintPart, /^-# /);

        const metaParts = textParts.filter((content) => content.includes('-#'));
        assert.equal(metaParts.length, 1);
        assert.match(metaParts[0], /league owner/i);
    });

    it('strips legacy league meta and post-image hints for dashboard visual panels', () => {
        const payload = buildScoreEntryV2Reply({
            tr,
            slug: 'super-lig',
            titleParams: { name: 'Süper Lig', round: 1, totalRounds: 6, pageLabel: '' },
            renderResult: {
                buffer: Buffer.from('png'),
                filename: 'score-super-lig-r1-p1.png',
            },
            canReport: true,
        });

        const { contentParts } = splitLeagueContainerParts(payload, { stripLegacyChrome: true });

        assert.equal(contentParts.length, 1);
        assert.equal(contentParts[0].type, ComponentType.MediaGallery);
        assert.ok(
            contentParts.every((part) => part.type !== ComponentType.TextDisplay),
        );
    });

    it('styles control hints as visible lines with emoji', () => {
        const budget = createEmojiBudget(tr);
        const hint = buildControlHint('Pick a match below', 'info', budget);

        assert.match(hint, /^💡 /);
        assert.doesNotMatch(hint, /^-# /);
    });
});