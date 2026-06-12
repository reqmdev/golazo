const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildGroupFixtures, getMaxGroupRounds } = require('./groupFixture');

describe('groupFixture', () => {
    it('builds double round-robin fixtures per group', () => {
        const fixtures = buildGroupFixtures({
            tournamentId: 't1',
            leagueId: 'l1',
            guildId: 'g1',
            groups: [
                { id: 'A', teamIds: ['a', 'b', 'c', 'd'] },
            ],
        });

        assert.ok(fixtures.length > 0);
        assert.ok(fixtures.every((f) => f.competitionPhase === 'champions_group'));
        assert.ok(fixtures.every((f) => f.groupId === 'A'));
        assert.equal(getMaxGroupRounds([{ id: 'A', teamIds: ['a', 'b', 'c', 'd'] }]), 6);
    });
});
