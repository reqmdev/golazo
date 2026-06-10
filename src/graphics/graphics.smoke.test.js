const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createSvgRenderer } = require('../../dist/graphics/adapters');
const { buildStandingsView } = require('../league/render/data/standingsView');
const { buildFixtureView } = require('../league/render/data/fixtureView');
const { buildMatchResultView } = require('../league/render/data/matchResultView');
const { buildTeamListView } = require('../league/render/data/teamListView');
const { MATCH_STATUS } = require('../league/constants/matchStatus');
const { DEFAULT_TEAM_LIMITS } = require('../league/constants/defaults');

const oid = (suffix) => `0000000000000000000000${suffix}`;

describe('graphics SVG render smoke', () => {
    it('renders match result PNG via SVG engine', async () => {
        const league = { _id: oid('aa'), name: 'Super Lig', slug: 'super-lig', season: 1 };
        const match = {
            _id: oid('m1'),
            round: 3,
            homeTeamId: oid('01'),
            awayTeamId: oid('02'),
            status: MATCH_STATUS.COMPLETED,
            score: { home: 2, away: 1 }
        };
        const teamMap = new Map([
            [oid('01'), { _id: oid('01'), name: 'Galatasaray', shortName: 'GS', colors: { primary: '#ff0000' } }],
            [oid('02'), { _id: oid('02'), name: 'Fenerbahce', shortName: 'FB', colors: { primary: '#ffff00' } }]
        ]);
        const view = buildMatchResultView(league, match, teamMap);
        const renderer = createSvgRenderer('match_result');
        const result = await renderer.render(view);

        assert.ok(Buffer.isBuffer(result.buffer));
        assert.ok(result.buffer.length > 2000);
        assert.match(result.filename, /^result-/);
    });

    it('renders standings PNG via SVG engine', async () => {
        const league = { _id: oid('aa'), name: 'Super Lig', slug: 'super-lig', season: 1, format: 'single_round_robin' };
        const standing = {
            version: 2,
            calculatedAt: new Date(),
            entries: [{
                teamId: oid('01'),
                rank: 1,
                played: 3,
                won: 2,
                drawn: 1,
                lost: 0,
                gf: 5,
                ga: 2,
                gd: 3,
                points: 7,
                form: ['W', 'D', 'W']
            }]
        };
        const teamMap = new Map([[oid('01'), { name: 'Galatasaray', shortName: 'GS', colors: { primary: '#ff0000' } }]]);
        const view = buildStandingsView(league, standing, teamMap);
        const renderer = createSvgRenderer('standings');
        const result = await renderer.render(view);

        assert.ok(Buffer.isBuffer(result.buffer));
        assert.ok(result.buffer.length > 2000);
    });

    it('renders team list PNG via SVG engine', async () => {
        const league = { _id: oid('aa'), name: 'Super Lig', slug: 'super-lig', season: 1, status: 'registration' };
        const teams = [
            {
                _id: oid('01'),
                name: 'Galatasaray',
                shortName: 'GS',
                captainId: '111',
                roleId: '222',
                colors: { primary: '#ff0000', secondary: '#ffffff' },
                logoUrl: null
            },
            {
                _id: oid('02'),
                name: 'Fenerbahce',
                shortName: 'FB',
                colors: { primary: '#ffff00', secondary: '#000000' }
            }
        ];
        const captainLabels = new Map([[oid('01'), 'Captain One']]);
        const roleLabels = new Map([[oid('01'), 'GS Role']]);
        const view = buildTeamListView(league, teams, { captainLabels, roleLabels });
        const renderer = createSvgRenderer('team_list');
        const result = await renderer.render(view);

        assert.ok(Buffer.isBuffer(result.buffer));
        assert.ok(result.buffer.length > 2000);
        assert.match(result.filename, /^teams-/);
    });

    it('keeps full league on one standings page', async () => {
        const league = { _id: oid('aa'), name: 'Fake Lig', slug: 'fake-lig', season: 1, format: 'single_round_robin' };
        const entries = Array.from({ length: DEFAULT_TEAM_LIMITS.maxTeams }, (_, index) => ({
            teamId: oid(String(index + 1).padStart(2, '0')),
            rank: index + 1,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0,
            form: []
        }));
        const standing = { version: 2, calculatedAt: new Date(), entries };
        const teamMap = new Map(
            entries.map((entry, index) => [
                entry.teamId,
                { name: `Team ${index + 1}`, shortName: `T${index + 1}`, colors: { primary: '#445566' } }
            ])
        );
        const view = buildStandingsView(league, standing, teamMap);
        const renderer = createSvgRenderer('standings');
        const result = await renderer.render(view);

        assert.equal(result.meta.totalPages, 1);
        assert.equal(result.meta.rows.length, DEFAULT_TEAM_LIMITS.maxTeams);
        assert.equal(result.meta.hasPagination, false);
        assert.ok(result.buffer.length > 5000);
    });

    it('keeps full league on one team list page', async () => {
        const league = { _id: oid('aa'), name: 'Fake Lig', slug: 'fake-lig', season: 1, status: 'registration' };
        const teams = Array.from({ length: DEFAULT_TEAM_LIMITS.maxTeams }, (_, index) => ({
            _id: oid(String(index + 1).padStart(2, '0')),
            name: `Team ${index + 1}`,
            shortName: `T${index + 1}`,
            colors: { primary: '#445566', secondary: '#778899' }
        }));
        const view = buildTeamListView(league, teams);
        const renderer = createSvgRenderer('team_list');
        const result = await renderer.render(view);

        assert.equal(result.meta.totalPages, 1);
        assert.equal(result.meta.rows.length, DEFAULT_TEAM_LIMITS.maxTeams);
        assert.equal(result.meta.hasPagination, false);
        assert.ok(result.buffer.length > 5000);
    });

    it('renders fixture PNG via SVG engine', async () => {
        const league = { _id: oid('aa'), name: 'Lig', slug: 'lig', totalRounds: 6, currentRound: 2 };
        const matches = [{
            _id: oid('m1'),
            round: 2,
            leg: 1,
            homeTeamId: oid('01'),
            awayTeamId: oid('02'),
            status: MATCH_STATUS.COMPLETED,
            score: { home: 2, away: 1 }
        }];
        const teamMap = new Map([
            [oid('01'), { name: 'Home FC' }],
            [oid('02'), { name: 'Away FC' }]
        ]);
        const view = buildFixtureView(league, 2, matches, teamMap, []);
        const renderer = createSvgRenderer('fixture');
        const result = await renderer.render(view);

        assert.ok(Buffer.isBuffer(result.buffer));
        assert.ok(result.buffer.length > 2000);
    });
});