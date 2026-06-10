"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTheme = void 0;
exports.createSvgRenderer = createSvgRenderer;
exports.shouldUseSvgEngine = shouldUseSvgEngine;
exports.renderHelpFooterSvg = renderHelpFooterSvg;
exports.renderBrandMarkSvg = renderBrandMarkSvg;
const path = __importStar(require("path"));
const theme_1 = require("../utils/theme");
Object.defineProperty(exports, "resolveTheme", { enumerable: true, get: function () { return theme_1.resolveTheme; } });
const MatchResultCard_1 = require("../cards/MatchResultCard");
const StandingsCard_1 = require("../cards/StandingsCard");
const FixtureCard_1 = require("../cards/FixtureCard");
const TeamsCard_1 = require("../cards/TeamsCard");
const HelpFooterCard_1 = require("../cards/HelpFooterCard");
function getLogoFetcher() {
    const fetchModule = path.join(process.cwd(), 'src', 'league', 'utils', 'validateLogoUrl.js');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { fetchLogoBuffer } = require(fetchModule);
    return fetchLogoBuffer;
}
class SvgRendererBase {
    theme;
    constructor(options = {}) {
        this.theme = (0, theme_1.resolveTheme)(options.themeId, { primary: options.accentColor });
    }
}
class SvgMatchResultRenderer extends SvgRendererBase {
    async render(view) {
        return (0, MatchResultCard_1.renderMatchResultCard)(view, this.theme, getLogoFetcher());
    }
}
class SvgStandingsRenderer extends SvgRendererBase {
    async render(view) {
        return (0, StandingsCard_1.renderStandingsCard)(view, this.theme, getLogoFetcher());
    }
}
class SvgFixtureRenderer extends SvgRendererBase {
    async render(view) {
        return (0, FixtureCard_1.renderFixtureCard)(view, this.theme, getLogoFetcher());
    }
}
class SvgTeamsRenderer extends SvgRendererBase {
    async render(view) {
        return (0, TeamsCard_1.renderTeamsCard)(view, this.theme, getLogoFetcher());
    }
}
const SVG_RENDERERS = {
    match_result: SvgMatchResultRenderer,
    standings: SvgStandingsRenderer,
    fixture: SvgFixtureRenderer,
    team_list: SvgTeamsRenderer,
};
function createSvgRenderer(type, options = {}) {
    const Renderer = SVG_RENDERERS[type];
    if (!Renderer) {
        throw new Error(`Unknown SVG renderer type: ${type}`);
    }
    return new Renderer(options);
}
function shouldUseSvgEngine(type, config) {
    if (config.engine === 'svg')
        return true;
    if (config.svgCards?.includes(type))
        return true;
    return false;
}
async function renderHelpFooterSvg(input) {
    const theme = (0, theme_1.resolveTheme)('sports_dark');
    return (0, HelpFooterCard_1.renderHelpFooterCard)(input, theme);
}
async function renderBrandMarkSvg() {
    return (0, HelpFooterCard_1.renderBrandMarkCard)((0, theme_1.resolveTheme)('sports_dark'));
}
//# sourceMappingURL=index.js.map