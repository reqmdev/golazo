const config = require('../../../config');
const Console = require('../../../utils/Console');

const LEGACY_RENDERERS = {
    match_result: require('../renderers/MatchResultRenderer'),
    standings: require('../renderers/StandingsRenderer'),
    fixture: require('../renderers/FixtureRenderer'),
    team_list: require('../renderers/TeamsRenderer')
};

const SVG_CARD_TYPES = ['match_result', 'standings', 'fixture', 'team_list'];

let svgAdapters = null;
let svgAdaptersFailed = false;
let startupChecked = false;

function getSvgAdapters() {
    if (svgAdaptersFailed) {
        return null;
    }

    if (!svgAdapters) {
        try {
            svgAdapters = require('../../../../dist/graphics/adapters');
        } catch (err) {
            svgAdaptersFailed = true;
            return null;
        }
    }

    return svgAdapters;
}

function resolveSvgCardTypes(renderConfig) {
    if (renderConfig.engine === 'svg') {
        return SVG_CARD_TYPES;
    }

    return (renderConfig.svgCards || []).filter((type) => SVG_CARD_TYPES.includes(type));
}

/**
 * Warm up dist/graphics once at startup and log render routing.
 */
function initRenderEngine() {
    if (startupChecked) {
        return { svgReady: Boolean(getSvgAdapters()) };
    }

    startupChecked = true;

    const renderConfig = config.render || {};
    const adapters = getSvgAdapters();
    const svgReady = Boolean(adapters);
    const svgCards = resolveSvgCardTypes(renderConfig);

    if (svgCards.length === 0) {
        Console.info('Graphics: canvas engine');
        return { svgReady };
    }

    if (!svgReady) {
        Console.warn(
            'Graphics: SVG dist missing — run npm run build:graphics. Falling back to canvas for visuals.'
        );
        return { svgReady };
    }

    if (renderConfig.engine === 'svg') {
        Console.success('Graphics: SVG engine ready');
    } else {
        Console.success(`Graphics: canvas + SVG for ${svgCards.join(', ')}`);
    }

    return { svgReady };
}

/**
 * @param {'match_result' | 'standings' | 'fixture' | 'team_list'} type
 */
function shouldUseSvg(type) {
    const renderConfig = config.render || {};
    const adapters = getSvgAdapters();
    if (!adapters) {
        return false;
    }

    return adapters.shouldUseSvgEngine(type, renderConfig);
}

/**
 * @param {'match_result' | 'standings' | 'fixture' | 'team_list'} type
 * @param {{ themeId?: string, accentColor?: string }} [options]
 */
function createRenderer(type, options = {}) {
    if (shouldUseSvg(type)) {
        const adapters = getSvgAdapters();
        if (adapters) {
            return adapters.createSvgRenderer(type, options);
        }
    }

    const LegacyRenderer = LEGACY_RENDERERS[type];
    if (!LegacyRenderer) {
        throw new Error(`Unknown renderer type: ${type}`);
    }

    return new LegacyRenderer(options);
}

module.exports = {
    createRenderer,
    shouldUseSvg,
    initRenderEngine
};