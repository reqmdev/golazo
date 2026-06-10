const { drawTextFit } = require("./drawTextFit");
const { drawTeamRow } = require("./drawTeamRow");
const { setFont } = require("../utils/typography");
const { LAYOUT } = require("../constants/layout");
const { resolveRankColor, resolveQualificationColor } = require("./rank");

/**
 * @typedef {{ key: string, label: string, width: number, align?: 'left'|'center'|'right', type?: 'text'|'team' }} TableColumn
 */

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {{ x: number, y: number, width: number, columns: TableColumn[] }} header
 * @param {object} theme
 */
function drawTableHeader(ctx, header, theme) {
  const { x, y, width, columns } = header;

  // Flat header — hairline below only (Sofa style). No fill tint.
  setFont(ctx, "micro", theme.textSecondary);

  let offset = x + 16;

  for (const column of columns) {
    ctx.textAlign = column.align || "left";
    ctx.textBaseline = "middle";
    const textX =
      column.align === "center"
        ? offset + column.width / 2
        : column.align === "right"
          ? offset + column.width - 4
          : offset;
    ctx.fillText(
      column.label, // keep original casing from labels (sentence or UPPER as designed in i18n)
      textX,
      y + LAYOUT.tableHeaderHeight / 2,
    );
    offset += column.width;
  }
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {{ x: number, y: number, width: number, height: number, columns: TableColumn[], row: object, index: number, logos?: Map<string, import('@napi-rs/canvas').Image | null>, isLast?: boolean }} block
 * @param {object} theme
 */
function drawTableRow(ctx, block, theme) {
  const { x, y, width, height, columns, row, index, logos, isLast } = block;

  // No alternating heavy tints. Minimal zebra via PRO.subtleTint if wanted (disabled for clean Sofa).
  // if (index % 2 === 1) { ctx.fillStyle = "rgba(255,255,255,0.01)"; ctx.fillRect... }

  const rank = Number(row.rank ?? 0);
  const qualColor = resolveQualificationColor(rank, theme);

  if (qualColor) {
    ctx.fillStyle = qualColor;
    // Stronger left qualification bar (SofaScore tables)
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 6, 5, height - 12, 2);
    ctx.fill();
  }

  let offset = x + 16;

  for (const column of columns) {
    if (column.type === "team") {
      drawTeamRow(
        ctx,
        {
          x: offset,
          y,
          width: column.width,
          height,
          team: { ...row.team, form: row.form },
          logo: logos?.get(row.team.id) ?? null,
          showForm: true,
        },
        theme,
      );
    } else if (column.key === "rank") {
      // Subtle circle/pill for top ranks (Sofa-like)
      const rankColor = resolveRankColor(rank, theme);

      if (rank > 0) {
        ctx.fillStyle = rankColor + (rank <= 3 ? "33" : "18");
        ctx.beginPath();
        ctx.arc(offset + column.width / 2, y + height / 2, 15, 0, Math.PI * 2);
        ctx.fill();

        if (rank <= 3) {
          ctx.strokeStyle = rankColor + "44";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      drawTextFit(
        ctx,
        String(rank),
        offset + column.width / 2,
        y + height / 2,
        column.width - 4,
        {
          variant: "stat",
          color: rankColor,
          align: "center",
          baseline: "middle",
        },
      );
    } else {
      const value = String(row[column.key] ?? "");
      const isPoints = column.key === "points";
      const emphasize = isPoints;

      drawTextFit(
        ctx,
        value,
        offset + (column.align === "center" ? column.width / 2 : 0),
        y + height / 2,
        column.width - 8,
        {
          variant: "stat",
          color: emphasize ? theme.textPrimary : theme.textSecondary,
          align: column.align || "left",
          baseline: "middle",
        },
      );
    }

    offset += column.width;
  }

  if (!isLast) {
    ctx.strokeStyle = theme.borderSubtle || "#1f232b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + height - 0.5);
    ctx.lineTo(x + width - 16, y + height - 0.5);
    ctx.stroke();
  }
}

/**
 * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
 * @param {{ x: number, y: number, width: number, columns: TableColumn[], rows: object[], logos?: Map<string, import('@napi-rs/canvas').Image | null>, rowHeight?: number }} table
 * @param {object} theme
 */
function drawTable(ctx, table, theme) {
  const {
    x,
    y,
    width,
    columns,
    rows,
    logos,
    rowHeight = LAYOUT.rowHeight,
  } = table;

  const bodyHeight =
    rows.length * rowHeight + Math.max(0, rows.length - 1) * LAYOUT.rowGap;
  const totalHeight =
    LAYOUT.tableHeaderHeight + LAYOUT.tableHeaderGap + bodyHeight;

  // Flat table (no outer glass card). Data lives directly on the canvas bg.
  // A very subtle top hairline or nothing is enough for pro tables.
  drawTableHeader(ctx, { x, y, width, columns }, theme);

  // Thin separator under header (Sofa)
  ctx.strokeStyle = theme.borderSubtle || "#23272f";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 12, y + LAYOUT.tableHeaderHeight + 0.5);
  ctx.lineTo(x + width - 12, y + LAYOUT.tableHeaderHeight + 0.5);
  ctx.stroke();

  let rowY = y + LAYOUT.tableHeaderHeight + LAYOUT.tableHeaderGap;

  rows.forEach((row, index) => {
    drawTableRow(
      ctx,
      {
        x,
        y: rowY,
        width,
        height: rowHeight,
        columns,
        row,
        index,
        logos,
        isLast: index === rows.length - 1,
      },
      theme,
    );
    rowY += rowHeight + LAYOUT.rowGap;
  });

  return y + totalHeight;
}

module.exports = {
  drawTable,
  drawTableHeader,
  drawTableRow,
};
