const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { isDevCommandsEnabled, isDevCommandName } = require('./devCommands');

describe('devCommands', () => {
    /** @type {string | undefined} */
    let originalDevMode;
    /** @type {string | undefined} */
    let originalEnable;

    beforeEach(() => {
        originalDevMode = process.env.GOLAZO_DEV_MODE;
        originalEnable = process.env.GOLAZO_ENABLE_DEV_COMMANDS;
        delete process.env.GOLAZO_DEV_MODE;
        delete process.env.GOLAZO_ENABLE_DEV_COMMANDS;
    });

    afterEach(() => {
        if (originalDevMode === undefined) {
            delete process.env.GOLAZO_DEV_MODE;
        } else {
            process.env.GOLAZO_DEV_MODE = originalDevMode;
        }

        if (originalEnable === undefined) {
            delete process.env.GOLAZO_ENABLE_DEV_COMMANDS;
        } else {
            process.env.GOLAZO_ENABLE_DEV_COMMANDS = originalEnable;
        }
    });

    it('disables dev commands by default', () => {
        assert.equal(isDevCommandsEnabled(), false);
    });

    it('enables dev commands when GOLAZO_ENABLE_DEV_COMMANDS=true', () => {
        process.env.GOLAZO_ENABLE_DEV_COMMANDS = 'true';
        assert.equal(isDevCommandsEnabled(), true);
    });

    it('identifies developer command names', () => {
        assert.equal(isDevCommandName('eval'), true);
        assert.equal(isDevCommandName('league'), false);
    });
});