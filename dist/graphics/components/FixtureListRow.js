"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixtureListRow = FixtureListRow;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TeamLogo_1 = require("./TeamLogo");
const CardIcon_1 = require("./CardIcon");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
const layout_1 = require("../tokens/layout");
const contentBlock_1 = require("../utils/contentBlock");
const FIXTURE_SCORE_INNER_GAP = 10;
const FIXTURE_SCORE_STATUS_GAP = 8;
const FIXTURE_SCORE_ROW = 22;
const FIXTURE_STATUS_ROW = 14;
const FIXTURE_STATUS_ICON_SIZE = 12;
const FIXTURE_STATUS_ICON_GAP = 5;
const FIXTURE_CENTER_LANE_PAD = 16;
function fixtureScoreWidth(homeGoals, awayGoals) {
    const home = String(homeGoals);
    const away = String(awayGoals);
    const dash = '–';
    return ((0, TextMeasurer_1.measureText)('scoreMd', home) +
        FIXTURE_SCORE_INNER_GAP +
        (0, TextMeasurer_1.measureText)('scoreMd', dash) +
        FIXTURE_SCORE_INNER_GAP +
        (0, TextMeasurer_1.measureText)('scoreMd', away));
}
function fixtureCenterDash(centerX, y, theme) {
    return (0, SvgBuilder_1.h)('line', {
        x1: centerX - 10,
        y1: y,
        x2: centerX + 10,
        y2: y,
        stroke: theme.textMuted,
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        opacity: 0.42,
    });
}
function fixturePlayedScore(centerX, y, homeGoals, awayGoals, theme) {
    const home = String(homeGoals);
    const away = String(awayGoals);
    const dash = '–';
    const homeW = (0, TextMeasurer_1.measureText)('scoreMd', home);
    const dashW = (0, TextMeasurer_1.measureText)('scoreMd', dash);
    const awayW = (0, TextMeasurer_1.measureText)('scoreMd', away);
    const totalW = homeW + FIXTURE_SCORE_INNER_GAP + dashW + FIXTURE_SCORE_INNER_GAP + awayW;
    let x = centerX - totalW / 2;
    const homeEl = (0, SvgBuilder_1.h)('text', {
        x: x + homeW / 2,
        y,
        className: 'scoreMd tabular',
        fill: theme.textPrimary,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, home);
    x += homeW + FIXTURE_SCORE_INNER_GAP;
    const dashEl = (0, SvgBuilder_1.h)('text', {
        x: x + dashW / 2,
        y,
        className: 'scoreMd tabular',
        fill: theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        opacity: 0.45,
    }, dash);
    x += dashW + FIXTURE_SCORE_INNER_GAP;
    const awayEl = (0, SvgBuilder_1.h)('text', {
        x: x + awayW / 2,
        y,
        className: 'scoreMd tabular',
        fill: theme.textPrimary,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, away);
    return (0, SvgBuilder_1.h)('g', homeEl, dashEl, awayEl);
}
function fixtureStatusBadge(centerX, y, isPlayed, statusLabel, statusTone) {
    const label = (0, TextMeasurer_1.truncateText)('chip', statusLabel, 80);
    const labelW = (0, TextMeasurer_1.measureText)('chip', label);
    const groupW = FIXTURE_STATUS_ICON_SIZE + FIXTURE_STATUS_ICON_GAP + labelW;
    const startX = centerX - groupW / 2;
    const iconY = y - FIXTURE_STATUS_ICON_SIZE / 2;
    return (0, SvgBuilder_1.h)('g', (0, CardIcon_1.CardIcon)({
        kind: isPlayed ? 'played' : 'upcoming',
        x: startX,
        y: iconY,
        size: FIXTURE_STATUS_ICON_SIZE,
        stroke: statusTone,
        strokeWidth: 1.7,
    }), (0, SvgBuilder_1.h)('text', {
        x: startX + FIXTURE_STATUS_ICON_SIZE + FIXTURE_STATUS_ICON_GAP,
        y,
        className: 'chip',
        fill: statusTone,
        'text-anchor': 'start',
        'dominant-baseline': 'middle',
    }, label));
}
function FixtureListRow(props) {
    const pad = contentBlock_1.fixtureRowInset;
    const logoSize = layout_1.layout.logoSizeMd;
    const rowMidY = props.height / 2;
    const centerX = props.width / 2;
    const statusLabel = props.row.isPlayed
        ? props.playedLabel || 'Played'
        : props.upcomingLabel || 'Upcoming';
    const statusTone = props.row.isPlayed ? props.theme.textMuted : props.theme.textSecondary;
    const parsed = props.row.scoreText.match(/(\d+)\s*[-–]\s*(\d+)/);
    const homeGoals = parsed ? Number(parsed[1]) : 0;
    const awayGoals = parsed ? Number(parsed[2]) : 0;
    const showScore = props.row.isPlayed && parsed;
    const statusText = (0, TextMeasurer_1.truncateText)('chip', statusLabel, 80);
    const statusGroupW = FIXTURE_STATUS_ICON_SIZE + FIXTURE_STATUS_ICON_GAP + (0, TextMeasurer_1.measureText)('chip', statusText);
    const scoreW = showScore ? fixtureScoreWidth(homeGoals, awayGoals) : 20;
    const centerHalf = Math.max(scoreW / 2, statusGroupW / 2, layout_1.layout.scoreLaneWidth / 2) + FIXTURE_CENTER_LANE_PAD;
    const blockH = FIXTURE_SCORE_ROW + FIXTURE_SCORE_STATUS_GAP + FIXTURE_STATUS_ROW;
    const scoreY = rowMidY - blockH / 2 + FIXTURE_SCORE_ROW / 2;
    const statusY = rowMidY + blockH / 2 - FIXTURE_STATUS_ROW / 2;
    const homeLogoX = pad;
    const awayLogoX = props.width - pad - logoSize;
    const homeNameX = homeLogoX + logoSize + 12;
    const awayNameX = awayLogoX - 12;
    const homeNameMax = centerX - centerHalf - homeNameX - 8;
    const awayNameMax = awayNameX - (centerX + centerHalf) - 8;
    const logoY = rowMidY - logoSize / 2;
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, props.row.leg && props.row.leg > 1 && props.legLabel
        ? (0, SvgBuilder_1.h)('text', {
            x: pad,
            y: rowMidY - 22,
            className: 'micro',
            fill: props.theme.textMuted,
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('micro', props.legLabel(props.row.leg), 80))
        : null, (0, TeamLogo_1.TeamLogo)({
        x: homeLogoX,
        y: logoY,
        size: logoSize,
        logoBuffer: props.logos.get(props.row.home.id) ?? null,
        team: props.row.home,
        clipId: `fixture-home-${props.row.home.id}-${props.index}`,
    }), (0, SvgBuilder_1.h)('text', {
        x: homeNameX,
        y: rowMidY,
        className: 'bodySm',
        fill: props.theme.textPrimary,
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('bodySm', props.row.home.name, homeNameMax)), showScore
        ? fixturePlayedScore(centerX, scoreY, homeGoals, awayGoals, props.theme)
        : fixtureCenterDash(centerX, scoreY, props.theme), fixtureStatusBadge(centerX, statusY, Boolean(props.row.isPlayed), statusLabel, statusTone), (0, SvgBuilder_1.h)('text', {
        x: awayNameX,
        y: rowMidY,
        className: 'bodySm',
        fill: props.theme.textPrimary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('bodySm', props.row.away.name, awayNameMax)), (0, TeamLogo_1.TeamLogo)({
        x: awayLogoX,
        y: logoY,
        size: logoSize,
        logoBuffer: props.logos.get(props.row.away.id) ?? null,
        team: props.row.away,
        clipId: `fixture-away-${props.row.away.id}-${props.index}`,
    }), !props.isLast
        ? (0, SvgBuilder_1.h)('line', {
            x1: pad,
            y1: props.height,
            x2: props.width - pad,
            y2: props.height,
            stroke: surfaces_1.surfaces.strokeSubtle,
            'stroke-width': 1,
            opacity: 0.35,
        })
        : null);
}
//# sourceMappingURL=FixtureListRow.js.map