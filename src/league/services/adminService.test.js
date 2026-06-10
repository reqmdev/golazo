const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const AdminService = require('./AdminService');
const { DEFAULT_TEAM_LIMITS } = require('../constants/defaults');

describe('AdminService', () => {
    it('exposes fake league slug constant', () => {
        assert.equal(AdminService.FAKE_LEAGUE_SLUG, 'fake-lig');
    });

    it('requires confirm flag for wipe', async () => {
        await assert.rejects(
            () => AdminService.wipeGuildLeagueData('guild-1', { confirm: false }),
            (err) => err.code === 'ADMIN_WIPE_CONFIRM_REQUIRED',
        );
    });

    it('clamps team count to league limits', () => {
        assert.equal(DEFAULT_TEAM_LIMITS.maxTeams, 20);
        assert.equal(DEFAULT_TEAM_LIMITS.minTeams, 2);
    });
});