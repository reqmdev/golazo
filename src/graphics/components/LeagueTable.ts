import { h, SvgChild } from '../core/SvgBuilder';
import { TeamRow } from './TeamRow';
import { TeamForm } from './TeamForm';
import { CardIcon, CardIconKind } from './CardIcon';
import { resolveHeaderCellLayout } from './tableHeaderCell';
import { truncateText } from '../typography/TextMeasurer';
import { resolveRankColor } from '../utils/colors';
import { surfaces } from '../tokens/surfaces';
import { layout } from '../tokens';
import type { TypeVariant } from '../typography/styles';
import type { Theme } from '../core/types';

/** Only the team column repeats the card-level icon anchor on the left. */
const HEADER_ICONS: Partial<Record<string, CardIconKind>> = {
  team: 'teams',
};

export interface TableColumn {
  key: string;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'team';
}

export interface TableMetrics {
  rowHeight: number;
  rowGap: number;
  tableHeaderHeight: number;
  headerIconSize: number;
  logoSize: number;
  logoGap: number;
  formDotSize: number;
  formGap: number;
  teamNameClass: TypeVariant;
}

const DEFAULT_METRICS: TableMetrics = {
  rowHeight: layout.rowHeight,
  rowGap: layout.rowGap,
  tableHeaderHeight: layout.tableHeaderHeight,
  headerIconSize: 11,
  logoSize: layout.logoSize,
  logoGap: 10,
  formDotSize: layout.formDotSize,
  formGap: layout.formGap,
  teamNameClass: 'bodySm',
};

function columnsWidth(columns: TableColumn[]): number {
  return columns.reduce((sum, column) => sum + column.width, 0);
}

function tableInset(width: number, columns: TableColumn[]): number {
  return Math.max(0, (width - columnsWidth(columns)) / 2);
}

function tableHeader(
  columns: TableColumn[],
  width: number,
  theme: Theme,
  metrics: TableMetrics,
): SvgChild {
  let offset = tableInset(width, columns);
  const items: SvgChild[] = [];

  for (const column of columns) {
    const iconKind = HEADER_ICONS[column.key];
    const cell = resolveHeaderCellLayout(offset, column, iconKind, metrics.headerIconSize);

    if (iconKind) {
      items.push(
        CardIcon({
          kind: iconKind,
          x: cell.iconX,
          y: metrics.tableHeaderHeight / 2 - cell.iconSize / 2,
          size: cell.iconSize,
          stroke: theme.textMuted,
          strokeWidth: 1.6,
        }),
      );
    }

    items.push(
      h(
        'text',
        {
          x: cell.textX,
          y: metrics.tableHeaderHeight / 2,
          className: 'overline uppercase',
          fill: theme.textMuted,
          'text-anchor': cell.textAnchor,
          'dominant-baseline': 'middle',
          opacity: 0.75,
        },
        column.label,
      ),
    );
    offset += column.width;
  }

  return h('g', items);
}

function tableRow(
  block: {
    width: number;
    y: number;
    height: number;
    columns: TableColumn[];
    row: Record<string, unknown>;
    logos: Map<string, Buffer | null>;
    metrics: TableMetrics;
    isLast?: boolean;
  },
  theme: Theme,
): SvgChild {
  const { width, y, height, columns, row, logos, metrics, isLast } = block;
  const rank = Number(row.rank ?? 0);
  const items: SvgChild[] = [];
  const rowMidY = y + height / 2;
  let offset = tableInset(width, columns);

  for (const column of columns) {
    if (column.type === 'team') {
      const team = row.team as {
        id: string;
        name: string;
        displayName?: string;
        shortName?: string;
        color?: string;
      };
      items.push(
        TeamRow({
          x: offset,
          y,
          width: column.width,
          height,
          team,
          logoBuffer: logos.get(team.id) ?? null,
          logoSize: metrics.logoSize,
          logoGap: metrics.logoGap,
          nameClass: metrics.teamNameClass,
          theme,
        }),
      );
    } else if (column.key === 'rank') {
      const rankColor = resolveRankColor(rank, theme);
      items.push(
        h(
          'text',
          {
            x: offset + column.width / 2,
            y: rowMidY,
            className: rank <= 3 ? 'stat tabular' : 'caption tabular',
            fill: rankColor,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
          },
          truncateText('stat', String(rank), column.width - 4),
        ),
      );
    } else if (column.key === 'form') {
      const form = row.form as string[] | undefined;
      const dotSize = metrics.formDotSize;
      const gap = metrics.formGap;
      const formWidth = 5 * dotSize + 4 * gap;
      const formX = offset + (column.width - formWidth) / 2;
      items.push(
        TeamForm({
          x: formX,
          centerY: rowMidY,
          form: form ?? [],
          theme,
          dotSize,
          gap,
        }),
      );
    } else {
      const value = String(row[column.key] ?? '');
      const isPoints = column.key === 'points';
      const isGd = column.key === 'gd';
      let valueColor = isPoints ? theme.textPrimary : theme.textSecondary;
      if (isGd && value.startsWith('+')) valueColor = theme.accent;
      if (isGd && value.startsWith('-')) valueColor = theme.loss;

      const textX =
        column.align === 'center'
          ? offset + column.width / 2
          : column.align === 'right'
            ? offset + column.width - 4
            : offset;

      items.push(
        h(
          'text',
          {
            x: textX,
            y: rowMidY,
            className: 'stat tabular',
            fill: valueColor,
            'text-anchor': column.align === 'center' ? 'middle' : column.align === 'right' ? 'end' : 'start',
            'dominant-baseline': 'middle',
            opacity: isPoints ? 1 : 0.68,
          },
          truncateText('stat', value, column.width - 8),
        ),
      );
    }
    offset += column.width;
  }

  if (!isLast) {
    const inset = tableInset(width, columns);
    items.push(
      h('line', {
        x1: inset,
        y1: y + height,
        x2: width - inset,
        y2: y + height,
        stroke: surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.35,
      }),
    );
  }

  return h('g', items);
}

export function LeagueTable(props: {
  x: number;
  y: number;
  width: number;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  logos: Map<string, Buffer | null>;
  metrics?: TableMetrics;
  theme: Theme;
}) {
  const { width, columns, rows, logos, theme } = props;
  const metrics = props.metrics ?? DEFAULT_METRICS;
  const rowHeight = metrics.rowHeight;
  const inner: SvgChild[] = [tableHeader(columns, width, theme, metrics)];

  let rowY = metrics.tableHeaderHeight + layout.tableHeaderGap;
  rows.forEach((row, index) => {
    inner.push(
      tableRow(
        {
          width,
          y: rowY,
          height: rowHeight,
          columns,
          row,
          logos,
          metrics,
          isLast: index === rows.length - 1,
        },
        theme,
      ),
    );
    rowY += rowHeight + metrics.rowGap;
  });

  return h('g', { transform: `translate(${props.x},${props.y})` }, ...inner);
}