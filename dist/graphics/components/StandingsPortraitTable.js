"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandingsPortraitTable = StandingsPortraitTable;
const SvgBuilder_1 = require("../core/SvgBuilder");
const TeamLogo_1 = require("./TeamLogo");
const TeamForm_1 = require("./TeamForm");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const colors_1 = require("../utils/colors");
const surfaces_1 = require("../tokens/surfaces");
const cardLayout_1 = require("../tokens/cardLayout");
function headerRow(width, theme) {
    const cols = [
        { label: '#', x: 0, anchor: 'start' },
        { label: 'Club', x: 36, anchor: 'start' },
        { label: 'P', x: 408, anchor: 'middle' },
        { label: '+/-', x: 448, anchor: 'middle' },
        { label: 'Pts', x: width, anchor: 'end' },
    ];
    return (0, SvgBuilder_1.h)('g', ...cols.map((col) => (0, SvgBuilder_1.h)('text', {
        x: col.x,
        y: cardLayout_1.portrait.standingsHeaderHeight / 2,
        className: 'overline uppercase',
        fill: theme.textMuted,
        'text-anchor': col.anchor,
        'dominant-baseline': 'middle',
        opacity: 0.7,
    }, col.label)));
}
function portraitRow(row, y, width, logo, index, theme, isLast) {
    const rank = Number(row.rank ?? 0);
    const qualColor = (0, colors_1.resolveQualificationColor)(rank, theme);
    const rankColor = (0, colors_1.resolveRankColor)(rank, theme);
    const hgt = cardLayout_1.portrait.standingsRowHeight;
    const record = `${row.won ?? 0}W · ${row.drawn ?? 0}D · ${row.lost ?? 0}L`;
    const items = [];
    if (index % 2 === 1) {
        items.push((0, SvgBuilder_1.h)('rect', {
            x: 0,
            y,
            width,
            height: hgt,
            fill: surfaces_1.surfaces.highlight,
        }));
    }
    if (qualColor) {
        items.push((0, SvgBuilder_1.h)('rect', { x: 0, y: y + 8, width: 2, height: hgt - 16, fill: qualColor, opacity: 0.7 }));
    }
    items.push((0, SvgBuilder_1.h)('text', {
        x: 12,
        y: y + hgt / 2,
        className: rank <= 3 ? 'stat tabular' : 'caption tabular',
        fill: rankColor,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        opacity: rank <= 3 ? 1 : 0.85,
    }, String(rank)), (0, TeamLogo_1.TeamLogo)({
        x: 36,
        y: y + (hgt - 32) / 2,
        size: 32,
        logoBuffer: logo ?? null,
        team: row.team,
        clipId: `std-${row.team.id}-${index}`,
    }), (0, SvgBuilder_1.h)('text', {
        x: 76,
        y: y + hgt / 2 - 7,
        className: 'bodySm',
        fill: theme.textPrimary,
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('bodySm', row.team.name, 220)), (0, SvgBuilder_1.h)('text', {
        x: 76,
        y: y + hgt / 2 + 9,
        className: 'micro',
        fill: theme.textMuted,
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('micro', record, 200)));
    if (row.form?.length) {
        items.push((0, TeamForm_1.TeamForm)({
            x: 290,
            y: y + hgt / 2 + 9,
            form: row.form,
            theme,
            dotSize: 6,
            gap: 3,
        }));
    }
    const gdText = String(row.gd ?? '0');
    let gdColor = theme.textMuted;
    if (gdText.startsWith('+'))
        gdColor = theme.textSecondary;
    if (gdText.startsWith('-'))
        gdColor = theme.loss;
    items.push((0, SvgBuilder_1.h)('text', {
        x: 408,
        y: y + hgt / 2,
        className: 'caption tabular',
        fill: theme.textMuted,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, String(row.played ?? 0)), (0, SvgBuilder_1.h)('text', {
        x: 448,
        y: y + hgt / 2,
        className: 'caption tabular',
        fill: gdColor,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
    }, (0, TextMeasurer_1.truncateText)('caption', gdText, 36)), (0, SvgBuilder_1.h)('text', {
        x: width,
        y: y + hgt / 2,
        className: 'statLg tabular',
        fill: theme.textPrimary,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
    }, String(row.points ?? 0)));
    if (!isLast) {
        items.push((0, SvgBuilder_1.h)('line', {
            x1: 0,
            y1: y + hgt,
            x2: width,
            y2: y + hgt,
            stroke: surfaces_1.surfaces.strokeSubtle,
            'stroke-width': 1,
            opacity: 0.3,
        }));
    }
    return (0, SvgBuilder_1.h)('g', items);
}
function StandingsPortraitTable(props) {
    const bodyH = cardLayout_1.portrait.standingsHeaderHeight +
        cardLayout_1.portrait.standingsRowGap +
        props.rows.length * cardLayout_1.portrait.standingsRowHeight;
    const inner = [headerRow(props.width, props.theme)];
    inner.push((0, SvgBuilder_1.h)('line', {
        x1: 0,
        y1: cardLayout_1.portrait.standingsHeaderHeight,
        x2: props.width,
        y2: cardLayout_1.portrait.standingsHeaderHeight,
        stroke: surfaces_1.surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.35,
    }));
    let rowY = cardLayout_1.portrait.standingsHeaderHeight + cardLayout_1.portrait.standingsRowGap;
    props.rows.forEach((row, index) => {
        inner.push(portraitRow(row, rowY, props.width, props.logos.get(row.team.id), index, props.theme, index === props.rows.length - 1));
        rowY += cardLayout_1.portrait.standingsRowHeight;
    });
    return (0, SvgBuilder_1.h)('g', { transform: `translate(${props.x},${props.y})` }, ...inner);
}
//# sourceMappingURL=StandingsPortraitTable.js.map