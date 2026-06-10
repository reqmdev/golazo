"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMatchResultCard = renderMatchResultCard;
const SvgBuilder_1 = require("../core/SvgBuilder");
const RenderPipeline_1 = require("../core/RenderPipeline");
const CardFrame_1 = require("../components/CardFrame");
const SportsCardBody_1 = require("../components/SportsCardBody");
const SportsCardHeader_1 = require("../components/SportsCardHeader");
const MatchHeroRow_1 = require("../components/MatchHeroRow");
const SportsCardFooter_1 = require("../components/SportsCardFooter");
const AssetCache_1 = require("../core/AssetCache");
const cardLayout_1 = require("../tokens/cardLayout");
async function renderMatchResultCard(view, theme, fetchLogo) {
    const logos = await (0, AssetCache_1.loadTeamLogos)([view.home, view.away], fetchLogo);
    const width = cardLayout_1.card.width;
    const height = (0, cardLayout_1.matchCardHeight)();
    const contentWidth = width - cardLayout_1.card.padding * 2;
    const homeGoals = view.match.homeGoals ?? 0;
    const awayGoals = view.match.awayGoals ?? 0;
    const y = cardLayout_1.card.padding;
    const heroY = y + cardLayout_1.card.headerHeight + cardLayout_1.card.headerGap;
    const footerY = height - cardLayout_1.card.padding - cardLayout_1.card.footerHeight;
    const document = new SvgBuilder_1.SvgDocument(width, height, [
        (0, CardFrame_1.CardFrame)({
            width,
            height,
            theme,
            children: [
                (0, SportsCardBody_1.SportsCardBody)({
                    x: cardLayout_1.card.padding,
                    y: heroY - 8,
                    width: contentWidth,
                    height: cardLayout_1.card.matchHeroHeight + 16,
                }),
                (0, SportsCardHeader_1.SportsCardHeader)({
                    x: cardLayout_1.card.padding,
                    y,
                    width: contentWidth,
                    title: view.league.name,
                    subtitle: view.labels.subtitle,
                    status: view.match.resultLabel || 'FT',
                    meta: `R${view.match.round}${view.match.leg && view.match.leg > 1 ? ` · L${view.match.leg}` : ''}`,
                    icon: 'match',
                    theme,
                }),
                (0, MatchHeroRow_1.MatchHeroRow)({
                    x: cardLayout_1.card.padding,
                    y: heroY,
                    width: contentWidth,
                    height: cardLayout_1.card.matchHeroHeight,
                    home: view.home,
                    away: view.away,
                    homeLogo: logos.get(view.home.id) ?? null,
                    awayLogo: logos.get(view.away.id) ?? null,
                    homeGoals,
                    awayGoals,
                    statusLabel: view.match.resultLabel || 'FT',
                    winner: view.match.winner,
                    theme,
                }),
                (0, SportsCardFooter_1.SportsCardFooter)({
                    x: cardLayout_1.card.padding,
                    y: footerY,
                    width: contentWidth,
                    left: view.league.season ? `Season ${view.league.season}` : view.labels.subtitle,
                    right: 'Golazo',
                    theme,
                }),
            ],
        }),
    ], theme.canvas);
    const buffer = await (0, RenderPipeline_1.renderCard)(document, {
        width,
        height,
        theme,
        backgroundVariant: 'hero',
    });
    return {
        buffer,
        filename: `result-${view.league.slug}-r${view.match.round}.png`,
        meta: { matchId: view.match.id },
    };
}
//# sourceMappingURL=MatchResultCard.js.map