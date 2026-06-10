import { SvgDocument, h } from '../core/SvgBuilder';
import { renderCard } from '../core/RenderPipeline';
import { CardFrame } from '../components/CardFrame';

import { SportsCardHeader } from '../components/SportsCardHeader';

import { LeagueTable } from '../components/LeagueTable';
import { SportsCardFooter } from '../components/SportsCardFooter';
import { truncateText } from '../typography/TextMeasurer';
import { loadTeamLogos } from '../core/AssetCache';
import { paginateTable } from '../utils/paginate';
import { card, standingsCardHeight } from '../tokens/cardLayout';
import {
  buildStandingsColumns,
  STANDINGS_HEADER_ICON_SIZE,
  STANDINGS_TABLE_METRICS,
} from '../tokens/standingsGrid';
import { resolveCardContentArea, sumColumnWidths } from '../utils/contentBlock';
import type { RenderResult, Theme } from '../core/types';

export interface StandingsRow {
  team: {
    id: string;
    name: string;
    logoUrl?: string | null;
    color?: string;
    displayName?: string;
    shortName?: string;
  };
  form?: string[];
  rank?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  gf?: number;
  ga?: number;
  gd?: string | number;
  points?: number;
  [key: string]: unknown;
}

export interface StandingsView {
  league: { name: string; slug: string; season?: number };
  rows: StandingsRow[];
  page: number;
  labels: {
    subtitle: string;
    empty: string;
    badgePage: (page: number, total: number) => string;
    badgeTeams: string;
    footerPage: (page: number, total: number) => string;
    columns: Record<string, string>;
  };
}

export async function renderStandingsCard(
  view: StandingsView,
  theme: Theme,
  fetchLogo: (url: string) => Promise<Buffer | null>,
): Promise<RenderResult> {
  const labels = view.labels;
  const columns = buildStandingsColumns(labels);
  const pageInfo = paginateTable(view.rows, {
    page: view.page,
    pageSize: card.maxStandingsRows,
  });
  const logos = await loadTeamLogos(
    pageInfo.rows.map((row) => (row as StandingsRow).team),
    fetchLogo,
  );

  const width = card.width;
  const rowCount = Math.max(pageInfo.rows.length, 1);
  const height = standingsCardHeight(rowCount, pageInfo.hasPagination);
  const contentWidth = width - card.padding * 2;
  const area = resolveCardContentArea(contentWidth, sumColumnWidths(columns));
  const blockX = card.padding + area.originX;
  const blockW = area.width;
  const y = card.padding;

  const badge = labels.badgeTeams;

  const tableY = y + card.headerHeight + card.headerGap;

  const innerChildren = [
    SportsCardHeader({
      x: blockX,
      y,
      width: blockW,
      title: view.league.name,
      subtitle: labels.subtitle,
      status: badge,
      icon: 'standings',
      iconSize: STANDINGS_HEADER_ICON_SIZE,
      showDivider: false,
      theme,
    }),
  ];

  if (pageInfo.rows.length === 0) {
    innerChildren.push(
      h(
        'text',
        {
          x: width / 2,
          y: tableY + 40,
          className: 'body',
          fill: theme.textSecondary,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
        },
        truncateText('body', labels.empty, contentWidth - 24),
      ),
    );
  } else {
    innerChildren.push(
      LeagueTable({
        x: blockX,
        y: tableY,
        width: blockW,
        columns,
        rows: pageInfo.rows as Record<string, unknown>[],
        logos,
        metrics: STANDINGS_TABLE_METRICS,
        theme,
      }),
    );
  }

  const footerY = height - card.padding - card.footerHeight;
  innerChildren.push(
    SportsCardFooter({
      x: blockX,
      y: footerY,
      width: blockW,
      center: pageInfo.hasPagination
        ? labels.footerPage(pageInfo.page, pageInfo.totalPages)
        : undefined,
      right: 'Golazo',
      showDivider: false,
      theme,
    }),
  );

  const document = new SvgDocument(
    width,
    height,
    [CardFrame({ width, height, theme, children: innerChildren })],
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
    filename: `standings-${view.league.slug}-p${pageInfo.page}.png`,
    meta: pageInfo as unknown as Record<string, unknown>,
  };
}