const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const {
    t,
    createTranslator,
    interpolate,
    translateError,
    normalizeLocale
} = require('./index');
const {
    loadCatalog,
    flattenKeys,
    clearCatalogCache,
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE
} = require('./registry');
const { applySlashLocalizations } = require('./discordLocalizations');

describe('i18n', () => {
    it('normalizes locale codes', () => {
        assert.equal(normalizeLocale('tr-TR'), 'tr');
        assert.equal(normalizeLocale('en-US'), 'en');
        assert.equal(normalizeLocale('fr'), DEFAULT_LOCALE);
    });

    it('interpolates placeholders', () => {
        assert.equal(interpolate('Hello {name}!', { name: 'Golazo' }), 'Hello Golazo!');
        assert.equal(interpolate('Missing {x}', {}), 'Missing ');
    });

    it('translates known keys in en and tr', () => {
        assert.match(t('en', 'commands.ping.response', { ms: 42 }), /Pong/);
        assert.match(t('tr', 'commands.ping.response', { ms: 42 }), /Pong/);
    });

    it('falls back to English for missing tr keys', () => {
        clearCatalogCache();
        const en = loadCatalog('en');
        const key = 'commands.ping.response';
        assert.equal(t('tr', key, { ms: 1 }), t('en', key, { ms: 1 }));
        assert.ok(en);
    });

    it('createTranslator binds locale', () => {
        const trEn = createTranslator('en');
        const trTr = createTranslator('tr');

        assert.match(trEn('bot.GUILD_COOLDOWN', { cooldown: 3 }), /3/);
        assert.match(trTr('bot.GUILD_COOLDOWN', { cooldown: 3 }), /3/);
    });

    it('translateError uses errors namespace', () => {
        const message = translateError('MATCH_NOT_FOUND_SCHEDULED', 'en');
        assert.ok(typeof message === 'string');
        assert.notEqual(message, 'errors.MATCH_NOT_FOUND_SCHEDULED');
    });

    it('en and tr locale files have matching keys', () => {
        const enKeys = new Set(flattenKeys(loadCatalog('en')));
        const trKeys = new Set(flattenKeys(loadCatalog('tr')));

        const missingInTr = [...enKeys].filter((key) => !trKeys.has(key));
        const missingInEn = [...trKeys].filter((key) => !enKeys.has(key));

        assert.deepEqual(missingInTr, [], `tr.json missing keys: ${missingInTr.join(', ')}`);
        assert.deepEqual(missingInEn, [], `en.json missing keys: ${missingInEn.join(', ')}`);
    });

    it('language command source keys exist', () => {
        for (const source of ['user', 'guild', 'discord', 'default']) {
            assert.ok(t('en', `commands.language.source.${source}`));
            assert.ok(t('tr', `commands.language.source.${source}`));
        }
    });



    it('ui emoji keys exist in en and tr', () => {
        const emojiKeys = [
            'brand', 'success', 'error', 'warning', 'info',
            'league', 'team', 'fixture', 'score', 'standings',
            'settings', 'matchOps', 'language', 'cooldown', 'code', 'page'
        ];

        for (const key of emojiKeys) {
            const en = t('en', `ui.emoji.${key}`);
            const trVal = t('tr', `ui.emoji.${key}`);
            assert.ok(en && !en.startsWith('ui.emoji.'));
            assert.ok(trVal && !trVal.startsWith('ui.emoji.'));
        }
    });

    it('applySlashLocalizations adds Turkish descriptions', () => {
        const localized = applySlashLocalizations({
            name: 'ping',
            description: 'Golazo ping — replies with websocket latency.',
            type: 1
        });

        assert.equal(localized.description_localizations?.tr, 'Bot gecikmesini göster.');
    });

    it('applySlashLocalizations does not rename commands', () => {
        const localized = applySlashLocalizations({
            name: 'league',
            description: 'Golazo football league management.',
            type: 1,
            options: [
                {
                    name: 'list',
                    description: 'List all leagues in this server.',
                    type: 1
                }
            ]
        });

        assert.equal(localized.name, 'league');
        assert.equal(localized.name_localizations?.tr, undefined);
        assert.equal(localized.options?.[0]?.description_localizations?.tr, 'Sunucudaki ligleri listele.');
    });

    it('slash.tr.json is valid JSON', () => {
        const filePath = path.join(__dirname, 'locales', 'slash.tr.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        assert.ok(data.league?.options?.score);
        assert.ok(data.language?.options?.server);
    });
});