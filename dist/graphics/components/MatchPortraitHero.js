"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchPortraitHero = MatchPortraitHero;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TeamLogo_1 = require("./TeamLogo");
const TeamAccent_1 = require("./TeamAccent");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
const cardLayout_1 = require("../tokens/cardLayout");
function TeamBlock(props) {
    const logoSize = cardLayout_1.portrait.heroLogoSize;
    const cx = props.width / 2;
    const isTop = props.position === 'top';
    const logoY = isTop ? props.y + 28 : props.y + props.height - logoSize - 28;
    const nameY = isTop ? logoY + logoSize + 18 : logoY - 14;
    return (0, SvgBuilder_1.h)('g', (0, TeamAccent_1.TeamColorWash)({
        x: 0,
        y: props.y,
        width: props.width,
        height: props.height,
        color: props.team.color,
        align: isTop ? 'top' : 'bottom',
    }), (0, TeamLogo_1.TeamLogo)({
        x: cx - logoSize / 2,
        y: logoY,
        size: logoSize,
        logoBuffer: props.logoBuffer,
        team: { name: props.team.name, color: props.team.color ?? undefined },
        clipId: `portrait-${props.position}-${props.team.id}`,
    }), (0, SvgBuilder_1.h)('text', {
        x: cx,
        y: nameY,
        className: props.active ? 'title' : 'subtitle',
        fill: props.active ? props.theme.textPrimary : props.theme.textSecondary,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)(props.active ? 'title' : 'subtitle', props.team.name, props.width - 48)), props.team.shortName
        ? (0, SvgBuilder_1.h)('text', {
            x: cx,
            y: isTop ? nameY + 18 : nameY - 18,
            className: 'caption',
            fill: props.theme.textMuted,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', props.team.shortName, 64))
        : null);
}
function SplitScore(props) {
    const homeActive = props.winner === 'home';
    const awayActive = props.winner === 'away';
    const gap = 32;
    const homeX = props.cx - gap;
    const awayX = props.cx + gap;
    return (0, SvgBuilder_1.h)('g', (0, SvgBuilder_1.h)('text', {
        x: homeX,
        y: props.y,
        className: 'scoreXl tabular',
        fill: homeActive ? props.theme.textPrimary : props.theme.textSecondary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
        opacity: homeActive ? 1 : 0.65,
    }, String(props.homeGoals)), (0, SvgBuilder_1.h)('text', {
        x: props.cx,
        y: props.y,
        className: 'scoreMd tabular',
        fill: props.theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        opacity: 0.4,
    }, '–'), (0, SvgBuilder_1.h)('text', {
        x: awayX,
        y: props.y,
        className: 'scoreXl tabular',
        fill: awayActive ? props.theme.textPrimary : props.theme.textSecondary,
        'text-anchor': 'start',
        'dominant-baseline': 'middle',
        opacity: awayActive ? 1 : 0.65,
    }, String(props.awayGoals)));
}
/** Portrait match center — home top, score, away bottom. No boxed chrome. */
function MatchPortraitHero(props) {
    const teamH = cardLayout_1.portrait.teamBlockHeight;
    const scoreH = cardLayout_1.portrait.scoreZoneHeight;
    const scoreY = teamH;
    const cx = props.width / 2;
    const parsed = props.scoreText.match(/(\d+)\s*[-–]\s*(\d+)/);
    const homeGoals = props.homeGoals ?? (parsed ? Number(parsed[1]) : 0);
    const awayGoals = props.awayGoals ?? (parsed ? Number(parsed[2]) : 0);
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, TeamBlock({
        width: props.width,
        y: 0,
        height: teamH,
        team: props.home,
        logoBuffer: props.homeLogo,
        position: 'top',
        active: props.winner === 'home',
        theme: props.theme,
    }), (0, SvgBuilder_1.h)('line', {
        x1: 0,
        y1: scoreY,
        x2: props.width,
        y2: scoreY,
        stroke: surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.35,
    }), SplitScore({
        cx,
        y: scoreY + scoreH / 2 - 6,
        homeGoals,
        awayGoals,
        winner: props.winner,
        theme: props.theme,
    }), (0, SvgBuilder_1.h)('text', {
        x: cx,
        y: scoreY + scoreH / 2 + 28,
        className: 'chip uppercase',
        fill: props.theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('chip', props.statusLabel, 80)), (0, SvgBuilder_1.h)('line', {
        x1: 0,
        y1: scoreY + scoreH,
        x2: props.width,
        y2: scoreY + scoreH,
        stroke: surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.35,
    }), TeamBlock({
        width: props.width,
        y: scoreY + scoreH,
        height: teamH,
        team: props.away,
        logoBuffer: props.awayLogo,
        position: 'bottom',
        active: props.winner === 'away',
        theme: props.theme,
    }));
}
//# sourceMappingURL=MatchPortraitHero.js.map