const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const LeagueError = require('../errors/LeagueError');
const { assertValidLogoUrl, isBlockedHostname } = require('./validateLogoUrl');

describe('validateLogoUrl', () => {
    it('accepts public https urls', () => {
        assert.equal(
            assertValidLogoUrl('https://cdn.example.com/logo.png'),
            'https://cdn.example.com/logo.png'
        );
    });

    it('rejects non-https urls', () => {
        assert.throws(
            () => assertValidLogoUrl('http://example.com/logo.png'),
            (err) => err instanceof LeagueError && err.code === 'INVALID_LOGO_URL_HTTPS'
        );
    });

    it('rejects private hosts', () => {
        assert.ok(isBlockedHostname('127.0.0.1'));
        assert.ok(isBlockedHostname('192.168.1.10'));
        assert.throws(
            () => assertValidLogoUrl('https://127.0.0.1/logo.png'),
            (err) => err instanceof LeagueError
        );
    });

    it('returns null for empty input', () => {
        assert.equal(assertValidLogoUrl(null), null);
        assert.equal(assertValidLogoUrl('   '), null);
    });

    it('rejects redirect targets that resolve to private hosts', () => {
        assert.throws(
            () => assertValidLogoUrl('https://127.0.0.1/evil.png'),
            (err) => err instanceof LeagueError && err.code === 'INVALID_LOGO_URL_PRIVATE'
        );
    });

    it('exports manual redirect fetch helper', () => {
        const { fetchLogoResponse, MAX_REDIRECTS } = require('./validateLogoUrl');

        assert.equal(typeof fetchLogoResponse, 'function');
        assert.equal(MAX_REDIRECTS, 3);
    });
});