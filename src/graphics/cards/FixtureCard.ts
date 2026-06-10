import { SvgDocument, h } from '../core/SvgBuilder';
import { renderCard } from '../core/RenderPipeline';
import { CardFrame } from '../components/CardFrame';
import { SportsCardBody } from '../components/SportsCardBody';
import { SportsCardHeader } from '../components/SportsCardHeader';
import { FixtureListRow } from '../components/FixtureListRow';
import { SportsCardFooter } from '../components/SportsCardFooter';
import { truncateText } from '../typography/TextMeasurer';
import { loadTeamLogos } from '../core/AssetCache';
import { paginateTable } from '../utils/paginate';
import { layout } from '../tokens/layout';
import { card, fixtureCardHeight } from '../tokens/cardLayout';
import { cardIconOpticalInset, resolveCardContentArea } from '../utils/contentBlock';
import type { RenderResult, Theme } from '../core/types';

export interface FixtureRow {
  home: { id: string; name: string; shortName?: string; logoUrl?: string | null; color?: string };
  away: { id: string; name: string; shortName?: string; logoUrl?: string | null; color?: string };
  scoreText: string;
  isPlayed?: boolean;
  leg?: number;
  round?: number;
}

export interface FixtureView {
  league: { name: string; slug: string; totalRounds?: number; season?: number };
  round: number;
  rows: FixtureRow[];
  page?: number;
  byeTeams?: string[];
  labels: {
    subtitle: string;
    empty: string;
    badgePage: (page: number, total: number) => string;
    badgeMatches: string;
    footerPage: (page: number, total: number) => string;
    bye: (teams: string) => string;
    leg?: (leg: number) => string;
    played?: string;
    upcoming?: string;
  };
}

export async function renderFixtureCard(
  view: FixtureView,
  theme: Theme,
  fetchLogo: (url: string) => Promise<Buffer | null>,
): Promise<RenderResult> {
  const labels = view.labels;
  const pageInfo = paginateTable(view.rows, {
    page: view.page ?? 1,
    pageSize: card.maxFixtureRows,
  });

  const teams = (pageInfo.rows as FixtureRow[]).flatMap((row) => [row.home, row.away]);
  const logos = await loadTeamLogos(teams, fetchLogo);

  const height = fixtureCardHeight(
    pageInfo.rows.length,
    view.byeTeams?.length ?? 0,
    pageInfo.hasPagination,
  );

  const width = card.width;
  const contentWidth = width - card.padding * 2;
  const area = resolveCardContentArea(contentWidth, contentWidth - cardIconOpticalInset * 2);
  const blockX = card.padding + area.originX;
  const blockW = area.width;
  const badge = labels.badgeMatches;

  let y = card.padding + card.headerHeight + card.headerGap + card.sectionGap;
  const children = [
    SportsCardHeader({
      x: blockX,
      y: card.padding,
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
    children.push(
      h(
        'text',
        {
          x: blockX + blockW / 2,
          y: y + 28,
          className: 'body',
          fill: theme.textSecondary,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
        },
        truncateText('body', labels.empty, contentWidth),
      ),
    );
  }

  const rows = pageInfo.rows as FixtureRow[];
  if (rows.length > 0) {
    const listHeight =
      rows.length * layout.matchBlockHeight + Math.max(0, rows.length - 1) * layout.fixtureRowGap;
    children.push(
      SportsCardBody({
        x: blockX,
        y: y - 8,
        width: blockW,
        height: listHeight + 16,
      }),
    );
  }

  for (const [index, row] of rows.entries()) {
    children.push(
      FixtureListRow({
        x: blockX,
        y,
        width: blockW,
        height: layout.matchBlockHeight,
        row,
        logos,
        index,
        theme,
        legLabel: labels.leg,
        playedLabel: labels.played,
        upcomingLabel: labels.upcoming,
        isLast: index === rows.length - 1,
      }),
    );
    y += layout.matchBlockHeight + layout.fixtureRowGap;
  }

  if (view.byeTeams?.length) {
    children.push(
      h(
        'text',
        {
          x: blockX + blockW / 2,
          y: y + 18,
          className: 'caption',
          fill: theme.textMuted,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
        },
        truncateText('caption', labels.bye(view.byeTeams.join(', ')), blockW - 40),
      ),
    );
  }

  const footerY = height - card.padding - card.footerHeight;
  children.push(
    SportsCardFooter({
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
    }),
  );

  const document = new SvgDocument(
    width,
    height,
    [CardFrame({ width, height, theme, children })],
    theme.canvas,
  );

  const buffer = await renderCard(document, {
    width,
    height,
    theme,
    backgroundVariant: 'data',
  });

  return {
    buffer,
    filename: `fixture-${view.league.slug}-r${view.round}-p${pageInfo.page}.png`,
    meta: pageInfo as unknown as Record<string, unknown>,
  };
}