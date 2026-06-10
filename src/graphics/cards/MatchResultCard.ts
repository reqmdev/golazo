import { SvgDocument } from '../core/SvgBuilder';
import { renderCard } from '../core/RenderPipeline';
import { CardFrame } from '../components/CardFrame';
import { SportsCardBody } from '../components/SportsCardBody';
import { SportsCardHeader } from '../components/SportsCardHeader';
import { MatchHeroRow } from '../components/MatchHeroRow';
import { SportsCardFooter } from '../components/SportsCardFooter';
import { loadTeamLogos } from '../core/AssetCache';
import { card, matchCardHeight } from '../tokens/cardLayout';
import type { RenderResult, Theme } from '../core/types';

export interface MatchResultView {
  league: { name: string; slug: string; season?: number };
  home: { id: string; name: string; shortName?: string; logoUrl?: string | null; color?: string };
  away: { id: string; name: string; shortName?: string; logoUrl?: string | null; color?: string };
  match: {
    id: string;
    round: number;
    leg?: number;
    homeGoals?: number;
    awayGoals?: number;
    scoreText: string;
    resultLabel?: string;
    winner?: 'home' | 'away' | 'draw' | null;
  };
  labels: { subtitle: string };
}

export async function renderMatchResultCard(
  view: MatchResultView,
  theme: Theme,
  fetchLogo: (url: string) => Promise<Buffer | null>,
): Promise<RenderResult> {
  const logos = await loadTeamLogos([view.home, view.away], fetchLogo);
  const width = card.width;
  const height = matchCardHeight();
  const contentWidth = width - card.padding * 2;
  const homeGoals = view.match.homeGoals ?? 0;
  const awayGoals = view.match.awayGoals ?? 0;
  const y = card.padding;

  const heroY = y + card.headerHeight + card.headerGap;
  const footerY = height - card.padding - card.footerHeight;

  const document = new SvgDocument(
    width,
    height,
    [
      CardFrame({
        width,
        height,
        theme,
        children: [
          SportsCardBody({
            x: card.padding,
            y: heroY - 8,
            width: contentWidth,
            height: card.matchHeroHeight + 16,
          }),
          SportsCardHeader({
            x: card.padding,
            y,
            width: contentWidth,
            title: view.league.name,
            subtitle: view.labels.subtitle,
            status: view.match.resultLabel || 'FT',
            meta: `R${view.match.round}${view.match.leg && view.match.leg > 1 ? ` · L${view.match.leg}` : ''}`,
            icon: 'match',
            theme,
          }),
          MatchHeroRow({
            x: card.padding,
            y: heroY,
            width: contentWidth,
            height: card.matchHeroHeight,
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
          SportsCardFooter({
            x: card.padding,
            y: footerY,
            width: contentWidth,
            left: view.league.season ? `Season ${view.league.season}` : view.labels.subtitle,
            right: 'Golazo',
            theme,
          }),
        ],
      }),
    ],
    theme.canvas,
  );

  const buffer = await renderCard(document, {
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