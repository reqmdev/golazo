"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppHeader = AppHeader;
const SvgBuilder_1 = require("../core/SvgBuilder");
const Surface_1 = require("./Surface");
const StatPill_1 = require("./StatPill");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const surfaces_1 = require("../tokens/surfaces");
/** Compact sports-app top bar — left-aligned hierarchy, no centered billboard. */
function AppHeader(props) {
    const padL = 16;
    const titleY = 22;
    const subY = 38;
    return (0, Surface_1.Surface)({
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        theme: props.theme,
        variant: 'overlay',
        accentBar: true,
        children: [
            (0, SvgBuilder_1.h)('text', {
                x: padL,
                y: titleY,
                className: 'title',
                fill: props.theme.textPrimary,
                'dominant-baseline': 'middle',
            }, (0, TextMeasurer_1.truncateText)('title', props.title, props.width - 200)),
            props.subtitle
                ? (0, SvgBuilder_1.h)('text', {
                    x: padL,
                    y: subY,
                    className: 'caption',
                    fill: props.theme.textMuted,
                    'dominant-baseline': 'middle',
                }, (0, TextMeasurer_1.truncateText)('caption', props.subtitle, props.width - 200))
                : null,
            props.meta
                ? (0, SvgBuilder_1.h)('text', {
                    x: props.width - padL,
                    y: titleY,
                    className: 'overline uppercase',
                    fill: props.theme.textSecondary,
                    'text-anchor': 'end',
                    'dominant-baseline': 'middle',
                }, (0, TextMeasurer_1.truncateText)('overline', props.meta, 160))
                : null,
            props.badge
                ? (0, StatPill_1.StatusPill)({
                    x: props.width - padL,
                    y: subY,
                    label: props.badge,
                    theme: props.theme,
                    align: 'right',
                    tone: 'accent',
                })
                : null,
            (0, SvgBuilder_1.h)('rect', {
                x: padL,
                y: props.height - 1,
                width: props.width - padL * 2,
                height: 1,
                fill: surfaces_1.surfaces.strokeSubtle,
            }),
        ],
    });
}
//# sourceMappingURL=AppHeader.js.map