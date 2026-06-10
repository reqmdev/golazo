const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { replyInteractionError } = require('./interactionError');

/**
 * @param {Partial<import('discord.js').Interaction>} overrides
 */
function mockInteraction(overrides = {}) {
    return {
        replied: false,
        deferred: false,
        locale: 'en',
        guild: { id: '123' },
        user: { id: '456' },
        isRepliable: () => true,
        reply: async () => {},
        ...overrides,
    };
}

describe('replyInteractionError', () => {
    it('sends a reply for repliable interactions', async () => {
        let replyCalled = false;

        const interaction = mockInteraction({
            reply: async () => {
                replyCalled = true;
            },
        });

        const client = {
            resolveLocale: async () => ({ locale: 'en', source: 'default' }),
            getUserLocale: async () => null,
            getGuildDefaultLocale: async () => null,
        };

        await replyInteractionError(client, interaction, new Error('test failure'));

        assert.equal(replyCalled, true);
    });

    it('skips reply when interaction is not repliable', async () => {
        let called = false;

        const interaction = mockInteraction({
            isRepliable: () => false,
            reply: async () => {
                called = true;
            },
        });

        const client = {
            resolveLocale: async () => ({ locale: 'en', source: 'default' }),
        };

        await replyInteractionError(client, interaction, new Error('test failure'));

        assert.equal(called, false);
    });

    it('skips reply when interaction was already answered', async () => {
        let called = false;

        const interaction = mockInteraction({
            replied: true,
            reply: async () => {
                called = true;
            },
        });

        const client = {
            resolveLocale: async () => ({ locale: 'en', source: 'default' }),
        };

        await replyInteractionError(client, interaction, new Error('test failure'));

        assert.equal(called, false);
    });
});