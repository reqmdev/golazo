"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTeamsCard = renderTeamsCard;
const SvgBuilder_1 = require("../core/SvgBuilder");
const RenderPipeline_1 = require("../core/RenderPipeline");
const CardFrame_1 = require("../components/CardFrame");
const SportsCardHeader_1 = require("../components/SportsCardHeader");
const TeamListTable_1 = require("../components/TeamListTable");
const SportsCardFooter_1 = require("../components/SportsCardFooter");
const TextMeasurer_1 = require("../typography/TextMeasurer");
const AssetCache_1 = require("../core/AssetCache");
const paginate_1 = require("../utils/paginate");
const cardLayout_1 = require("../tokens/cardLayout");
const teamsGrid_1 = require("../tokens/teamsGrid");
const contentBlock_1 = require("../utils/contentBlock");
async function renderTeamsCard(view, theme, fetchLogo) {
    const labels = view.labels;
    const columns = (0, teamsGrid_1.buildTeamsColumns)(labels);
    const pageInfo = (0, paginate_1.paginateTable)(view.rows, {
        page: view.page,
        pageSize: cardLayout_1.card.maxTeamRows,
    });
    const logos = await (0, AssetCache_1.loadTeamLogos)(pageInfo.rows.map((row) => row.team), fetchLogo);
    const width = cardLayout_1.card.width;
    const rowCount = Math.max(pageInfo.rows.length, 1);
    const height = (0, cardLayout_1.teamsCardHeight)(rowCount, pageInfo.hasPagination);
    const contentWidth = width - cardLayout_1.card.padding * 2;
    const area = (0, contentBlock_1.resolveCardContentArea)(contentWidth, (0, contentBlock_1.sumColumnWidths)(columns));
    const blockX = cardLayout_1.card.padding + area.originX;
    const blockW = area.width;
    const y = cardLayout_1.card.padding;
    const badge = labels.badgeTeams;
    const tableY = y + cardLayout_1.card.headerHeight + cardLayout_1.card.headerGap;
    const innerChildren = [
        (0, SportsCardHeader_1.SportsCardHeader)({
            x: blockX,
            y,
            width: blockW,
            title: view.league.name,
            subtitle: labels.subtitle,
            status: badge,
            meta: view.league.season ? `S${view.league.season}` : undefined,
            icon: 'teams',
            showDivider: false,
            theme,
        }),
    ];
    if (pageInfo.rows.length === 0) {
        innerChildren.push((0, SvgBuilder_1.h)('text', {
            x: width / 2,
            y: tableY + 40,
            className: 'body',
            fill: theme.textSecondary,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
        }, (0, TextMeasurer_1.truncateText)('body', labels.empty, contentWidth - 24)));
    }
    else {
        innerChildren.push((0, TeamListTable_1.TeamListTable)({
            x: blockX,
            y: tableY,
            width: blockW,
            columns,
            rows: pageInfo.rows,
            logos,
            theme,
        }));
    }
    const footerY = height - cardLayout_1.card.padding - cardLayout_1.card.footerHeight;
    innerChildren.push((0, SportsCardFooter_1.SportsCardFooter)({
        x: blockX,
        y: footerY,
        width: blockW,
        center: pageInfo.hasPagination
            ? labels.footerPage(pageInfo.page, pageInfo.totalPages)
            : undefined,
        right: 'Golazo',
        showDivider: false,
        theme,
    }));
    const document = new SvgBuilder_1.SvgDocument(width, height, [(0, CardFrame_1.CardFrame)({ width, height, theme, children: innerChildren })], theme.canvas);
    const buffer = await (0, RenderPipeline_1.renderCard)(document, {
        width,
        height,
        theme,
        backgroundVariant: 'data',
    });
    return {
        buffer,
        filename: `teams-${view.league.slug}-p${pageInfo.page}.png`,
        meta: pageInfo,
    };
}
//# sourceMappingURL=TeamsCard.js.map