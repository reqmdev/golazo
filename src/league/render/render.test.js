const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { paginateTable } = require('./drawing/paginateTable');
const { buildStandingsView } = require('./data/standingsView');
const { buildFixtureView } = require('./data/fixtureView');
const { buildMatchResultView } = require('./data/matchResultView');
const { buildTeamListView } = require('./data/teamListView');
const { MATCH_STATUS } = require('../constants/matchStatus');

const oid = (suffix) => `0000000000000000000000${suffix}`;

describe('paginateTable', () => {
    it('returns single page for small row sets', () => {
        const rows = Array.from({ length: 5 }, (_, i) => ({ id: i }));
        const page = paginateTable(rows, { pageSize: 16 });

        assert.equal(page.totalPages, 1);
        assert.equal(page.rows.length, 5);
        assert.equal(page.hasPagination, false);
    });

    it('splits large tables and clamps page number', () => {
        const rows = Array.from({ length: 30 }, (_, i) => ({ id: i }));
        const page = paginateTable(rows, { page: 99, pageSize: 16 });

        assert.equal(page.totalPages, 2);
        assert.equal(page.page, 2);
        assert.equal(page.rows.length, 14);
        assert.equal(page.hasPagination, true);
    });
});

describe('standingsView', () => {
    it('maps standing entries to render rows', () => {
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

        assert.equal(view.rows.length, 1);
        assert.equal(view.rows[0].team.displayName, 'Galatasaray (GS)');
        assert.equal(view.rows[0].points, 7);
        assert.equal(view.meta.version, 2);
    });
});

describe('fixtureView', () => {
    it('builds match rows with score text', () => {
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

        const view = buildFixtureView(league, 2, matches, teamMap, ['Bye Team']);

        assert.equal(view.rows[0].scoreText, '2 - 1');
        assert.equal(view.rows[0].isPlayed, true);
        assert.deepEqual(view.byeTeams, ['Bye Team']);
    });
});

describe('teamListView', () => {
    it('maps teams to render rows with labels', () => {
        const league = { _id: oid('aa'), name: 'Super Lig', slug: 'super-lig', season: 1, status: 'registration' };
        const teams = [{
            _id: oid('01'),
            name: 'Galatasaray',
            shortName: 'GS',
            captainId: 'user1',
            roleId: 'role1',
            colors: { primary: '#ff0000', secondary: '#ffffff' }
        }];
        const captainLabels = new Map([[oid('01'), 'Arda']]);
        const roleLabels = new Map([[oid('01'), 'Galatasaray']]);

        const view = buildTeamListView(league, teams, { captainLabels, roleLabels });

        assert.equal(view.rows.length, 1);
        assert.equal(view.rows[0].team.name, 'Galatasaray');
        assert.equal(view.rows[0].captain, 'Arda');
        assert.equal(view.rows[0].role, 'Galatasaray');
        assert.equal(view.rows[0].team.secondaryColor, '#ffffff');
    });
});

describe('matchResultView', () => {
    it('detects walkover winner', () => {
        const league = { _id: oid('aa'), name: 'Lig', slug: 'lig' };
        const match = {
            _id: oid('m1'),
            round: 1,
            leg: 1,
            homeTeamId: oid('01'),
            awayTeamId: oid('02'),
            status: MATCH_STATUS.WALKOVER,
            score: { home: 3, away: 0 },
            meta: { walkoverWinnerId: oid('01') }
        };
        const teamMap = new Map([
            [oid('01'), { name: 'Home FC' }],
            [oid('02'), { name: 'Away FC' }]
        ]);

        const view = buildMatchResultView(league, match, teamMap);

        assert.equal(view.match.winner, 'home');
        assert.equal(view.match.resultLabel, 'Walkover');
    });
});