const { buildHelpColors } = require('../canvas/tokens');

const HELP_COLORS = buildHelpColors();

const HELP_SELECT_ID = 'help:category';

/** @type {readonly string[]} */
const HELP_PAGE_IDS = [
    'overview',
    'league_step_1',
    'league_step_2',
    'league_step_3',
    'league_step_4',
    'league_step_5',
    'league_step_6',
    'teams',
    'matches',
    'admin',
    'commands',
    'tips'
];

/** @deprecated Use HELP_COLORS — kept for accent lookups in V2 builders. */
const HELP_ACCENTS = HELP_COLORS;

module.exports = {
    HELP_COLORS,
    HELP_ACCENTS,
    HELP_SELECT_ID,
    HELP_PAGE_IDS,
    DEFAULT_HELP_PAGE: 'overview'
};