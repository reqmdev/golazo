import { h, SvgChild } from '../core/SvgBuilder';
import { TeamRow } from './TeamRow';
import { CardIcon, CardIconKind } from './CardIcon';
import { resolveHeaderCellLayout } from './tableHeaderCell';
import { truncateText } from '../typography/TextMeasurer';
import { surfaces } from '../tokens/surfaces';
import { layout } from '../tokens';
import type { Theme } from '../core/types';

const HEADER_ICONS: Partial<Record<string, CardIconKind>> = {
  team: 'teams',
  captain: 'captain',
  role: 'role',
  colors: 'colors',
};

export interface TeamListColumn {
  key: string;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  type?: 'team';
}

function columnsWidth(columns: TeamListColumn[]): number {
  return columns.reduce((sum, column) => sum + column.width, 0);
}

function tableInset(width: number, columns: TeamListColumn[]): number {
  return Math.max(0, (width - columnsWidth(columns)) / 2);
}

function colorSwatches(
  primary: string | undefined,
  secondary: string | undefined,
  x: number,
  y: number,
  columnWidth: number,
): SvgChild {
  const size = 14;
  const gap = 6;
  const blockWidth = size * 2 + gap;
  const startX = x + (columnWidth - blockWidth) / 2;
  const cy = y;

  return h(
    'g',
    h('rect', {
      x: startX,
      y: cy - size / 2,
      width: size,
      height: size,
      rx: 3,
      fill: primary || '#2a2f38',
      stroke: surfaces.strokeSubtle,
      'stroke-width': 1,
      opacity: 0.95,
    }),
    h('rect', {
      x: startX + size + gap,
      y: cy - size / 2,
      width: size,
      height: size,
      rx: 3,
      fill: secondary || '#ffffff',
      stroke: surfaces.strokeSubtle,
      'stroke-width': 1,
      opacity: 0.95,
    }),
  );
}

function tableHeader(columns: TeamListColumn[], width: number, theme: Theme): SvgChild {
  let offset = tableInset(width, columns);
  const items: SvgChild[] = [];

  for (const column of columns) {
    const iconKind = HEADER_ICONS[column.key];
    const cell = resolveHeaderCellLayout(offset, column, iconKind);

    if (iconKind) {
      items.push(
        CardIcon({
          kind: iconKind,
          x: cell.iconX,
          y: layout.tableHeaderHeight / 2 - cell.iconSize / 2,
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
          y: layout.tableHeaderHeight / 2,
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
    columns: TeamListColumn[];
    row: Record<string, unknown>;
    logos: Map<string, Buffer | null>;
    index: number;
    isLast?: boolean;
  },
  theme: Theme,
): SvgChild {
  const { width, y, height, columns, row, logos, index, isLast } = block;
  const items: SvgChild[] = [];
  const rowMidY = y + height / 2;
  let offset = tableInset(width, columns);

  for (const column of columns) {
    if (column.type === 'team') {
      const team = row.team as {
        id: string;
        name: string;
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
          theme,
        }),
      );
    } else if (column.key === 'colors') {
      const team = row.team as { color?: string; secondaryColor?: string };
      items.push(
        colorSwatches(team.color, team.secondaryColor, offset, rowMidY, column.width),
      );
    } else {
      const value = String(row[column.key] ?? '');
      const textX =
        column.align === 'center'
          ? offset + column.width / 2
          : column.align === 'right'
            ? offset + column.width - 4
            : offset + 4;

      items.push(
        h(
          'text',
          {
            x: textX,
            y: rowMidY,
            className: 'bodySm',
            fill: value === '—' || value === '-' ? theme.textMuted : theme.textSecondary,
            'text-anchor': column.align === 'center' ? 'middle' : column.align === 'right' ? 'end' : 'start',
            'dominant-baseline': 'middle',
            opacity: value === '—' || value === '-' ? 0.55 : 0.88,
          },
          truncateText('bodySm', value, column.width - 10),
        ),
      );
    }
    offset += column.width;
  }

  if (!isLast) {
    items.push(
      h('line', {
        x1: tableInset(width, columns),
        y1: y + height,
        x2: width - tableInset(width, columns),
        y2: y + height,
        stroke: surfaces.strokeSubtle,
        'stroke-width': 1,
        opacity: 0.35,
      }),
    );
  }

  return h('g', items);
}

export function TeamListTable(props: {
  x: number;
  y: number;
  width: number;
  columns: TeamListColumn[];
  rows: Record<string, unknown>[];
  logos: Map<string, Buffer | null>;
  theme: Theme;
}) {
  const { width, columns, rows, logos, theme } = props;
  const rowHeight = layout.teamRowHeight;
  const inner: SvgChild[] = [tableHeader(columns, width, theme)];

  let rowY = layout.tableHeaderHeight + layout.tableHeaderGap;
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
          index,
          isLast: index === rows.length - 1,
        },
        theme,
      ),
    );
    rowY += rowHeight + layout.rowGap;
  });

  return h('g', { transform: `translate(${props.x},${props.y})` }, ...inner);
}