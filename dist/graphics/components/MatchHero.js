"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchHero = MatchHero;
const SvgBuilder_1 = require("../core/SvgBuilder");
const Surface_1 = require("./Surface");
const TeamLogo_1 = require("./TeamLogo");
const ScoreModule_1 = require("./ScoreModule");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
const layout_1 = require("../tokens/layout");
function MatchHero(props) {
    const pad = 16;
    const logoSize = layout_1.layout.heroLogoSize;
    const midY = props.height / 2;
    const centerX = props.width / 2;
    const laneW = Math.floor((props.width - layout_1.layout.scoreBoxWidth - pad * 2) / 2);
    const homeActive = props.winner === 'home';
    const awayActive = props.winner === 'away';
    return (0, Surface_1.Surface)({
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        theme: props.theme,
        variant: 'raised',
        children: [
            (0, SvgBuilder_1.h)('line', {
                x1: centerX - layout_1.layout.scoreBoxWidth / 2 - 12,
                y1: 14,
                x2: centerX - layout_1.layout.scoreBoxWidth / 2 - 12,
                y2: props.height - 14,
                stroke: surfaces_1.surfaces.strokeSubtle,
                'stroke-width': 1,
            }),
            (0, SvgBuilder_1.h)('line', {
                x1: centerX + layout_1.layout.scoreBoxWidth / 2 + 12,
                y1: 14,
                x2: centerX + layout_1.layout.scoreBoxWidth / 2 + 12,
                y2: props.height - 14,
                stroke: surfaces_1.surfaces.strokeSubtle,
                'stroke-width': 1,
            }),
            (0, TeamLogo_1.TeamLogo)({
                x: pad,
                y: midY - logoSize / 2,
                size: logoSize,
                logoBuffer: props.homeLogo,
                team: props.home,
                clipId: `hero-home-${props.home.id}`,
            }),
            (0, SvgBuilder_1.h)('text', {
                x: pad + logoSize + 12,
                y: midY - 10,
                className: 'subtitle',
                fill: homeActive ? props.theme.textPrimary : props.theme.textSecondary,
                'dominant-baseline': 'middle',
            }, (0, TextMeasurer_1.truncateText)('subtitle', props.home.name, laneW - logoSize - 16)),
            props.home.shortName
                ? (0, SvgBuilder_1.h)('text', {
                    x: pad + logoSize + 12,
                    y: midY + 14,
                    className: 'overline uppercase',
                    fill: props.theme.textMuted,
                    'dominant-baseline': 'middle',
                }, (0, TextMeasurer_1.truncateText)('overline', props.home.shortName, 48))
                : null,
            homeActive
                ? (0, SvgBuilder_1.h)('rect', {
                    x: pad + logoSize + 12,
                    y: midY + 26,
                    width: 24,
                    height: 3,
                    rx: 1,
                    fill: props.theme.accent,
                })
                : null,
            (0, ScoreModule_1.ScoreModule)({
                centerX,
                centerY: midY,
                scoreText: props.scoreText,
                statusLabel: props.statusLabel,
                theme: props.theme,
                highlight: props.winner !== 'draw' && props.winner != null,
            }),
            (0, TeamLogo_1.TeamLogo)({
                x: props.width - pad - logoSize,
                y: midY - logoSize / 2,
                size: logoSize,
                logoBuffer: props.awayLogo,
                team: props.away,
                clipId: `hero-away-${props.away.id}`,
            }),
            (0, SvgBuilder_1.h)('text', {
                x: props.width - pad - logoSize - 12,
                y: midY - 10,
                className: 'subtitle',
                fill: awayActive ? props.theme.textPrimary : props.theme.textSecondary,
                'text-anchor': 'end',
                'dominant-baseline': 'middle',
            }, (0, TextMeasurer_1.truncateText)('subtitle', props.away.name, laneW - logoSize - 16)),
            props.away.shortName
                ? (0, SvgBuilder_1.h)('text', {
                    x: props.width - pad - logoSize - 12,
                    y: midY + 14,
                    className: 'overline uppercase',
                    fill: props.theme.textMuted,
                    'text-anchor': 'end',
                    'dominant-baseline': 'middle',
                }, (0, TextMeasurer_1.truncateText)('overline', props.away.shortName, 48))
                : null,
            awayActive
                ? (0, SvgBuilder_1.h)('rect', {
                    x: props.width - pad - logoSize - 12 - 24,
                    y: midY + 26,
                    width: 24,
                    height: 3,
                    rx: 1,
                    fill: props.theme.accent,
                })
                : null,
        ],
    });
}
//# sourceMappingURL=MatchHero.js.map