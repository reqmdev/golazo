const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const StandingsRenderer = require('../league/render/renderers/StandingsRenderer');
const FixtureRenderer = require('../league/render/renderers/FixtureRenderer');
const MatchResultRenderer = require('../league/render/renderers/MatchResultRenderer');
const { buildStandingsView } = require('../league/render/data/standingsView');
const { buildFixtureView } = require('../league/render/data/fixtureView');
const { buildMatchResultView } = require('../league/render/data/matchResultView');
const { MATCH_STATUS } = require('../league/constants/matchStatus');

const oid = (suffix) => `0000000000000000000000${suffix}`;

describe('canvas render smoke', () => {
    it('renders standings PNG', async () => {
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
        const renderer = new StandingsRenderer();
        const result = await renderer.render(view);

        assert.ok(Buffer.isBuffer(result.buffer));
        assert.ok(result.buffer.length > 2000);
    });

    it('renders fixture PNG', async () => {
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
        const renderer = new FixtureRenderer();
        const result = await renderer.render(view);

        assert.ok(Buffer.isBuffer(result.buffer));
        assert.ok(result.buffer.length > 2000);
    });

    it('renders match result PNG', async () => {
        const league = { _id: oid('aa'), name: 'Lig', slug: 'lig' };
        const match = {
            _id: oid('m1'),
            round: 2,
            leg: 1,
            homeTeamId: oid('01'),
            awayTeamId: oid('02'),
            status: MATCH_STATUS.COMPLETED,
            score: { home: 2, away: 1 }
        };
        const teamMap = new Map([
            [oid('01'), { name: 'Home FC' }],
            [oid('02'), { name: 'Away FC' }]
        ]);
        const view = buildMatchResultView(league, match, teamMap);
        const renderer = new MatchResultRenderer();
        const result = await renderer.render(view);

        assert.ok(Buffer.isBuffer(result.buffer));
        assert.ok(result.buffer.length > 2000);
    });
});