const path = require('path');
const fs = require('fs');
const { loadCatalog } = require('./registry');

const DISCORD_TR = 'tr';

/** @type {Record<string, object> | null} */
let slashTrCatalog = null;

function loadSlashTrCatalog() {
    if (slashTrCatalog) {
        return slashTrCatalog;
    }

    const filePath = path.join(__dirname, 'locales', 'slash.tr.json');

    if (!fs.existsSync(filePath)) {
        slashTrCatalog = {};
        return slashTrCatalog;
    }

    slashTrCatalog = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return slashTrCatalog;
}

function clearSlashLocalizationCache() {
    slashTrCatalog = null;
}

/**
 * @param {object} node
 * @param {object | undefined} trNode
 */
function localizeNode(node, trNode) {
    if (!trNode) {
        if (!node.options?.length) {
            return node;
        }

        return {
            ...node,
            options: node.options.map((child) => localizeNode(child, undefined))
        };
    }

    const result = { ...node };

    if (typeof trNode.name === 'string') {
        result.name_localizations = {
            ...(result.name_localizations || {}),
            [DISCORD_TR]: trNode.name
        };
    }

    if (typeof trNode.description === 'string') {
        result.description_localizations = {
            ...(result.description_localizations || {}),
            [DISCORD_TR]: trNode.description
        };
    }

    if (Array.isArray(node.options)) {
        result.options = node.options.map((child) => {
            const childTr = trNode.options?.[child.name];
            return localizeNode(child, childTr);
        });
    }

    return result;
}

/**
 * Apply Turkish Discord slash localizations from locales/slash.tr.json.
 * @param {import('discord.js').RESTPostAPIChatInputApplicationCommandsJSONBody} commandDef
 */
function applySlashLocalizations(commandDef) {
    const catalog = loadSlashTrCatalog();
    const trNode = catalog[commandDef.name];

    if (!trNode) {
        return commandDef;
    }

    return localizeNode(commandDef, trNode);
}

/**
 * Choice name localizations for /language locale picker.
 * @param {Array<{ name: string, value: string }>} choices
 */
function localizeLocaleChoices(choices) {
    const catalog = loadCatalog('tr');

    return choices.map((choice) => ({
        ...choice,
        name_localizations: {
            tr: catalog.commands?.language?.choices?.[choice.value] || choice.name
        }
    }));
}

module.exports = {
    applySlashLocalizations,
    localizeLocaleChoices,
    clearSlashLocalizationCache,
    loadSlashTrCatalog
};