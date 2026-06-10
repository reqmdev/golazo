const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    resolveTeamLogoUrl,
    enrichTeamsWithLogoUrls,
    clearAvatarUrlCache,
} = require('./resolveTeamLogoUrl');

describe('resolveTeamLogoUrl', () => {
    it('prefers custom logoUrl over captain avatar', async () => {
        const client = {
            users: {
                fetch: async () => {
                    throw new Error('should not fetch when logoUrl is set');
                },
            },
        };

        const url = await resolveTeamLogoUrl(client, {
            logoUrl: 'https://cdn.example.com/logo.png',
            captainId: '123',
        });

        assert.equal(url, 'https://cdn.example.com/logo.png');
    });

    it('falls back to captain avatar when logoUrl is missing', async () => {
        const client = {
            users: {
                fetch: async (id) => ({
                    displayAvatarURL: () => `https://cdn.discordapp.com/avatars/${id}/abc.png?size=128`,
                }),
            },
        };

        const url = await resolveTeamLogoUrl(client, { captainId: '999' });

        assert.equal(url, 'https://cdn.discordapp.com/avatars/999/abc.png?size=128');
    });

    it('returns null when captain fetch fails', async () => {
        const client = {
            users: {
                fetch: async () => {
                    throw new Error('unknown user');
                },
            },
        };

        const url = await resolveTeamLogoUrl(client, { captainId: '404' });

        assert.equal(url, null);
    });

    it('reuses cached captain avatar URLs without refetching', async () => {
        clearAvatarUrlCache();
        let fetchCount = 0;
        const client = {
            users: {
                cache: new Map(),
                fetch: async (id) => {
                    fetchCount += 1;
                    return {
                        displayAvatarURL: () => `https://cdn.discordapp.com/avatars/${id}/cached.png?size=128`,
                    };
                },
            },
        };

        const team = { captainId: '777' };
        const first = await resolveTeamLogoUrl(client, team);
        const second = await resolveTeamLogoUrl(client, team);

        assert.equal(first, second);
        assert.equal(fetchCount, 1);
    });

    it('enriches teams with resolved logo URLs', async () => {
        const client = {
            users: {
                fetch: async (id) => ({
                    displayAvatarURL: () => `https://cdn.discordapp.com/avatars/${id}/face.png?size=128`,
                }),
            },
        };

        const teams = [
            { _id: '1', name: 'A', logoUrl: 'https://cdn.example.com/a.png' },
            { _id: '2', name: 'B', captainId: '55' },
        ];

        const enriched = await enrichTeamsWithLogoUrls(client, teams);

        assert.equal(enriched[0].logoUrl, 'https://cdn.example.com/a.png');
        assert.equal(enriched[1].logoUrl, 'https://cdn.discordapp.com/avatars/55/face.png?size=128');
    });
});