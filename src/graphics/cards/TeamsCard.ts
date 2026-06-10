import { SvgDocument, h } from '../core/SvgBuilder';
import { renderCard } from '../core/RenderPipeline';
import { CardFrame } from '../components/CardFrame';
import { SportsCardHeader } from '../components/SportsCardHeader';
import { TeamListTable } from '../components/TeamListTable';
import { SportsCardFooter } from '../components/SportsCardFooter';
import { truncateText } from '../typography/TextMeasurer';
import { loadTeamLogos } from '../core/AssetCache';
import { paginateTable } from '../utils/paginate';
import { card, teamsCardHeight } from '../tokens/cardLayout';
import { buildTeamsColumns } from '../tokens/teamsGrid';
import { resolveCardContentArea, sumColumnWidths } from '../utils/contentBlock';
import type { RenderResult, Theme } from '../core/types';

export interface TeamListRow {
  team: {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string | null;
    color?: string;
    secondaryColor?: string;
  };
  captain: string;
  role: string;
}

export interface TeamsView {
  league: { name: string; slug: string; status?: string; season?: number };
  rows: TeamListRow[];
  page: number;
  labels: {
    subtitle: string;
    empty: string;
    badgeTeams: string;
    badgePage: (page: number, total: number) => string;
    footerPage: (page: number, total: number) => string;
    columns: Record<string, string>;
  };
}

export async function renderTeamsCard(
  view: TeamsView,
  theme: Theme,
  fetchLogo: (url: string) => Promise<Buffer | null>,
): Promise<RenderResult> {
  const labels = view.labels;
  const columns = buildTeamsColumns(labels);
  const pageInfo = paginateTable(view.rows, {
    page: view.page,
    pageSize: card.maxTeamRows,
  });

  const logos = await loadTeamLogos(
    pageInfo.rows.map((row) => (row as TeamListRow).team),
    fetchLogo,
  );

  const width = card.width;
  const rowCount = Math.max(pageInfo.rows.length, 1);
  const height = teamsCardHeight(rowCount, pageInfo.hasPagination);
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
      meta: view.league.season ? `S${view.league.season}` : undefined,
      icon: 'teams',
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
      TeamListTable({
        x: blockX,
        y: tableY,
        width: blockW,
        columns,
        rows: pageInfo.rows as unknown as Record<string, unknown>[],
        logos,
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
    filename: `teams-${view.league.slug}-p${pageInfo.page}.png`,
    meta: pageInfo as unknown as Record<string, unknown>,
  };
}