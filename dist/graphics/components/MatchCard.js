"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchCard = MatchCard;
const SvgBuilder_1 = require("../core/SvgBuilder");
const Surface_1 = require("./Surface");
const TeamLogo_1 = require("./TeamLogo");
const StatPill_1 = require("./StatPill");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
const layout_1 = require("../tokens/layout");
function MatchCard(props) {
    const pad = 12;
    const logoSize = layout_1.layout.logoSizeMd;
    const midY = props.height / 2 + 6;
    const scoreX = props.width / 2;
    const statusLabel = props.row.isPlayed
        ? props.playedLabel || 'Played'
        : props.upcomingLabel || 'Upcoming';
    const statusTone = props.row.isPlayed ? 'muted' : 'live';
    return (0, Surface_1.Surface)({
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        theme: props.theme,
        variant: props.index % 2 === 0 ? 'raised' : 'overlay',
        children: [
            props.row.leg && props.row.leg > 1 && props.legLabel
                ? (0, StatPill_1.StatusPill)({
                    x: pad,
                    y: 14,
                    label: props.legLabel(props.row.leg),
                    theme: props.theme,
                    tone: 'muted',
                })
                : null,
            (0, StatPill_1.StatusPill)({
                x: props.width - pad,
                y: 14,
                label: statusLabel,
                theme: props.theme,
                align: 'right',
                tone: statusTone,
            }),
            (0, SvgBuilder_1.h)('line', {
                x1: pad,
                y1: 28,
                x2: props.width - pad,
                y2: 28,
                stroke: surfaces_1.surfaces.strokeSubtle,
                'stroke-width': 1,
            }),
            (0, TeamLogo_1.TeamLogo)({
                x: pad,
                y: midY - logoSize / 2,
                size: logoSize,
                logoBuffer: props.logos.get(props.row.home.id) ?? null,
                team: props.row.home,
                clipId: `fixture-home-${props.row.home.id}-${props.index}`,
            }),
            (0, SvgBuilder_1.h)('text', {
                x: pad + logoSize + 10,
                y: midY - 4,
                className: 'bodySm',
                fill: props.theme.textPrimary,
                'dominant-baseline': 'middle',
            }, (0, TextMeasurer_1.truncateText)('bodySm', props.row.home.name, scoreX - pad - logoSize - 80)),
            props.row.home.shortName
                ? (0, SvgBuilder_1.h)('text', {
                    x: pad + logoSize + 10,
                    y: midY + 12,
                    className: 'overline uppercase',
                    fill: props.theme.textMuted,
                    'dominant-baseline': 'middle',
                }, (0, TextMeasurer_1.truncateText)('overline', props.row.home.shortName, 32))
                : null,
            (0, SvgBuilder_1.h)('rect', {
                x: scoreX - 40,
                y: midY - 18,
                width: 80,
                height: 36,
                rx: 6,
                fill: surfaces_1.surfaces.inset,
                stroke: surfaces_1.surfaces.strokeSubtle,
                'stroke-width': 1,
            }),
            (0, SvgBuilder_1.h)('text', {
                x: scoreX,
                y: midY,
                className: 'scoreMd tabular',
                fill: props.row.isPlayed ? props.theme.textPrimary : props.theme.textMuted,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
            }, props.row.scoreText),
            (0, TeamLogo_1.TeamLogo)({
                x: props.width - pad - logoSize,
                y: midY - logoSize / 2,
                size: logoSize,
                logoBuffer: props.logos.get(props.row.away.id) ?? null,
                team: props.row.away,
                clipId: `fixture-away-${props.row.away.id}-${props.index}`,
            }),
            (0, SvgBuilder_1.h)('text', {
                x: props.width - pad - logoSize - 10,
                y: midY - 4,
                className: 'bodySm',
                fill: props.theme.textPrimary,
                'text-anchor': 'end',
                'dominant-baseline': 'middle',
            }, (0, TextMeasurer_1.truncateText)('bodySm', props.row.away.name, scoreX - pad - logoSize - 80)),
            props.row.away.shortName
                ? (0, SvgBuilder_1.h)('text', {
                    x: props.width - pad - logoSize - 10,
                    y: midY + 12,
                    className: 'overline uppercase',
                    fill: props.theme.textMuted,
                    'text-anchor': 'end',
                    'dominant-baseline': 'middle',
                }, (0, TextMeasurer_1.truncateText)('overline', props.row.away.shortName, 32))
                : null,
        ],
    });
}
//# sourceMappingURL=MatchCard.js.map