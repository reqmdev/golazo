const { SUPPORTED_LOCALES, DEFAULT_LOCALE } = require('./registry');

/**
 * @param {string | null | undefined} raw
 * @returns {string}
 */
function normalizeLocale(raw) {
    if (!raw || typeof raw !== 'string') {
        return DEFAULT_LOCALE;
    }

    const base = raw.trim().toLowerCase().split('-')[0];

    if (SUPPORTED_LOCALES.includes(base)) {
        return base;
    }

    return DEFAULT_LOCALE;
}

module.exports = { normalizeLocale };