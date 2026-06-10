"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFixtureCard = renderFixtureCard;
const SvgBuilder_1 = require("../core/SvgBuilder");
const RenderPipeline_1 = require("../core/RenderPipeline");
const CardFrame_1 = require("../components/CardFrame");
const SportsCardBody_1 = require("../components/SportsCardBody");
const SportsCardHeader_1 = require("../components/SportsCardHeader");
const FixtureListRow_1 = require("../components/FixtureListRow");
const SportsCardFooter_1 = require("../components/SportsCardFooter");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const AssetCache_1 = require("../core/AssetCache");
const paginate_1 = require("../utils/paginate");
const layout_1 = require("../tokens/layout");
const cardLayout_1 = require("../tokens/cardLayout");
const contentBlock_1 = require("../utils/contentBlock");
async function renderFixtureCard(view, theme, fetchLogo) {
    const labels = view.labels;
    const pageInfo = (0, paginate_1.paginateTable)(view.rows, {
        page: view.page ?? 1,
        pageSize: cardLayout_1.card.maxFixtureRows,
    });
    const teams = pageInfo.rows.flatMap((row) => [row.home, row.away]);
    const logos = await (0, AssetCache_1.loadTeamLogos)(teams, fetchLogo);
    const height = (0, cardLayout_1.fixtureCardHeight)(pageInfo.rows.length, view.byeTeams?.length ?? 0, pageInfo.hasPagination);
    const width = cardLayout_1.card.width;
    const contentWidth = width - cardLayout_1.card.padding * 2;
    const area = (0, contentBlock_1.resolveCardContentArea)(contentWidth, contentWidth - contentBlock_1.cardIconOpticalInset * 2);
    const blockX = cardLayout_1.card.padding + area.originX;
    const blockW = area.width;
    const badge = labels.badgeMatches;
    let y = cardLayout_1.card.padding + cardLayout_1.card.headerHeight + cardLayout_1.card.headerGap + cardLayout_1.card.sectionGap;
    const children = [
        (0, SportsCardHeader_1.SportsCardHeader)({
            x: blockX,
            y: cardLayout_1.card.padding,
            width: blockW,
            title: view.league.name,
            subtitle: labels.subtitle,
            status: badge,
            meta: view.league.season ? `S${view.league.season}` : undefined,
            icon: 'fixture',
            theme,
        }),
    ];
    if (pageInfo.rows.length === 0) {
        children.push((0, SvgBuilder_1.h)('text', {
            x: blockX + blockW / 2,
            y: y + 28,
            className: 'body',
            fill: theme.textSecondary,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('body', labels.empty, contentWidth)));
    }
    const rows = pageInfo.rows;
    if (rows.length > 0) {
        const listHeight = rows.length * layout_1.layout.matchBlockHeight + Math.max(0, rows.length - 1) * layout_1.layout.fixtureRowGap;
        children.push((0, SportsCardBody_1.SportsCardBody)({
            x: blockX,
            y: y - 8,
            width: blockW,
            height: listHeight + 16,
        }));
    }
    for (const [index, row] of rows.entries()) {
        children.push((0, FixtureListRow_1.FixtureListRow)({
            x: blockX,
            y,
            width: blockW,
            height: layout_1.layout.matchBlockHeight,
            row,
            logos,
            index,
            theme,
            legLabel: labels.leg,
            playedLabel: labels.played,
            upcomingLabel: labels.upcoming,
            isLast: index === rows.length - 1,
        }));
        y += layout_1.layout.matchBlockHeight + layout_1.layout.fixtureRowGap;
    }
    if (view.byeTeams?.length) {
        children.push((0, SvgBuilder_1.h)('text', {
            x: blockX + blockW / 2,
            y: y + 18,
            className: 'caption',
            fill: theme.textMuted,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('caption', labels.bye(view.byeTeams.join(', ')), blockW - 40)));
    }
    const footerY = height - cardLayout_1.card.padding - cardLayout_1.card.footerHeight;
    children.push((0, SportsCardFooter_1.SportsCardFooter)({
        x: blockX,
        y: footerY,
        width: blockW,
        center: pageInfo.hasPagination
            ? labels.footerPage(pageInfo.page, pageInfo.totalPages)
            : undefined,
        right: 'Golazo',
        rightSink: 10,
        showDivider: false,
        theme,
    }));
    const document = new SvgBuilder_1.SvgDocument(width, height, [(0, CardFrame_1.CardFrame)({ width, height, theme, children })], theme.canvas);
    const buffer = await (0, RenderPipeline_1.renderCard)(document, {
        width,
        height,
        theme,
        backgroundVariant: 'data',
    });
    return {
        buffer,
        filename: `fixture-${view.league.slug}-r${view.round}-p${pageInfo.page}.png`,
        meta: pageInfo,
    };
}
//# sourceMappingURL=FixtureCard.js.map