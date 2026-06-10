"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchHeroRow = MatchHeroRow;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TeamLogo_1 = require("./TeamLogo");
const ScoreDisplay_1 = require("./ScoreDisplay");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const layout_1 = require("../tokens/layout");
function MatchHeroRow(props) {
    const pad = 0;
    const logoSize = layout_1.layout.heroLogoSize;
    const midY = props.height / 2;
    const centerX = props.width / 2;
    const laneW = Math.floor((props.width - 200) / 2);
    const homeActive = props.winner === 'home';
    const awayActive = props.winner === 'away';
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, (0, TeamLogo_1.TeamLogo)({
        x: pad,
        y: midY - logoSize / 2,
        size: logoSize,
        logoBuffer: props.homeLogo,
        team: { name: props.home.name, color: props.home.color ?? undefined },
        clipId: `hero-home-${props.home.id}`,
    }), (0, SvgBuilder_1.h)('text', {
        x: pad + logoSize + 14,
        y: midY - 8,
        className: 'subtitle',
        fill: homeActive ? props.theme.textPrimary : props.theme.textSecondary,
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('subtitle', props.home.name, laneW - logoSize - 20)), props.home.shortName
        ? (0, SvgBuilder_1.h)('text', {
            x: pad + logoSize + 14,
            y: midY + 12,
            className: 'caption',
            fill: props.theme.textMuted,
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.home.shortName, 48))
        : null, (0, ScoreDisplay_1.ScoreDisplay)({
        x: centerX,
        y: midY,
        homeGoals: props.homeGoals,
        awayGoals: props.awayGoals,
        winner: props.winner,
        theme: props.theme,
    }), (0, TeamLogo_1.TeamLogo)({
        x: props.width - pad - logoSize,
        y: midY - logoSize / 2,
        size: logoSize,
        logoBuffer: props.awayLogo,
        team: { name: props.away.name, color: props.away.color ?? undefined },
        clipId: `hero-away-${props.away.id}`,
    }), (0, SvgBuilder_1.h)('text', {
        x: props.width - pad - logoSize - 14,
        y: midY - 8,
        className: 'subtitle',
        fill: awayActive ? props.theme.textPrimary : props.theme.textSecondary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('subtitle', props.away.name, laneW - logoSize - 20)), props.away.shortName
        ? (0, SvgBuilder_1.h)('text', {
            x: props.width - pad - logoSize - 14,
            y: midY + 12,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.away.shortName, 48))
        : null);
}
//# sourceMappingURL=MatchHeroRow.js.map