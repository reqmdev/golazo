const path = require('path');
const fs = require('fs');

const SUPPORTED_LOCALES = ['en', 'tr'];
const DEFAULT_LOCALE = 'en';

/** @type {Map<string, object>} */
const catalogs = new Map();

function loadCatalog(locale) {
    if (catalogs.has(locale)) {
        return catalogs.get(locale);
    }

    const filePath = path.join(__dirname, 'locales', `${locale}.json`);

    if (!fs.existsSync(filePath)) {
        catalogs.set(locale, {});
        return catalogs.get(locale);
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    catalogs.set(locale, data);
    return data;
}

function clearCatalogCache() {
    catalogs.clear();
}

/**
 * @param {object} obj
 * @param {string} keyPath
 */
function getNested(obj, keyPath) {
    return keyPath.split('.').reduce((acc, part) => {
        if (acc && typeof acc === 'object' && part in acc) {
            return acc[part];
        }

        return undefined;
    }, obj);
}

/**
 * Flatten nested object to dot keys for parity checks.
 * @param {object} obj
 * @param {string} [prefix]
 * @returns {string[]}
 */
function flattenKeys(obj, prefix = '') {
    const keys = [];

    for (const [key, value] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            keys.push(...flattenKeys(value, full));
        } else {
            keys.push(full);
        }
    }

    return keys;
}

module.exports = {
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
    loadCatalog,
    clearCatalogCache,
    getNested,
    flattenKeys
};