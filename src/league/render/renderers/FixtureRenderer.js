const BaseRenderer = require("./BaseRenderer");
const { LAYOUT, computeCanvasHeight } = require("../constants/layout");
const { createRenderCanvas } = require("../core/CanvasFactory");
const { drawHeader, drawTeamLogo } = require("../drawing");
const { drawTextFit } = require("../drawing/drawTextFit");
const { setFont } = require("../utils/typography");
const { paginateTable } = require("../drawing/paginateTable");

class FixtureRenderer extends BaseRenderer {
  /**
   * @param {ReturnType<import('../data/fixtureView').buildFixtureView>} view
   */
  async render(view) {
    const labels = view.labels;
    const pageInfo = paginateTable(view.rows, {
      page: view.page ?? 1,
      pageSize: LAYOUT.maxFixtureRowsPerPage,
    });

    const teams = pageInfo.rows.flatMap((row) => [row.home, row.away]);
    const logos = await this.loadLogos(teams);

    const byeHeight = view.byeTeams?.length ? 40 : 0;
    const height = computeCanvasHeight({
      rowHeight: LAYOUT.matchBlockHeight,
      rowCount: Math.max(pageInfo.rows.length, 1),
      rowGap: LAYOUT.fixtureRowGap,
      extra: byeHeight + (pageInfo.hasPagination ? 12 : 0),
    });

    const { canvas, ctx, width } = createRenderCanvas(LAYOUT.width, height);
    await this.paintBackground(ctx, width, height, "data");

    const contentWidth = width - LAYOUT.padding * 2;
    let y = LAYOUT.padding;

    const badge = pageInfo.hasPagination
      ? labels.badgePage(pageInfo.page, pageInfo.totalPages)
      : labels.badgeMatches;

    drawHeader(
      ctx,
      {
        x: LAYOUT.padding,
        y,
        width: contentWidth,
        height: LAYOUT.headerHeight,
        title: view.league.name,
        subtitle: labels.subtitle,
        badge,
      },
      this.theme,
    );

    y += LAYOUT.headerHeight + LAYOUT.headerGap;

    if (pageInfo.rows.length === 0) {
      drawTextFit(
        ctx,
        labels.empty,
        LAYOUT.padding + 12,
        y + 36,
        contentWidth,
        {
          variant: "body",
          color: this.theme.textSecondary,
          align: "center",
        },
      );
    }

    for (const [index, row] of pageInfo.rows.entries()) {
      this.drawMatchCard(ctx, {
        x: LAYOUT.padding,
        y,
        width: contentWidth,
        height: LAYOUT.matchBlockHeight,
        row,
        logos,
        index,
        labels,
      });
      y += LAYOUT.matchBlockHeight + LAYOUT.fixtureRowGap;
    }

    if (view.byeTeams?.length) {
      drawTextFit(
        ctx,
        labels.bye(view.byeTeams.join(", ")),
        LAYOUT.padding + 12,
        y + 22,
        contentWidth - 24,
        {
          variant: "caption",
          color: this.theme.textMuted,
        },
      );
    }

    if (pageInfo.hasPagination) {
      const footerY = height - LAYOUT.footerHeight;
      drawTextFit(
        ctx,
        labels.footerPage(pageInfo.page, pageInfo.totalPages),
        LAYOUT.padding,
        footerY,
        contentWidth,
        {
          variant: "caption",
          color: this.theme.textMuted,
          align: "center",
        },
      );
    }

    this.drawWatermark(
      ctx,
      LAYOUT.padding,
      height - 10,
      contentWidth,
      "Golazo",
    );

    return {
      buffer: this.toBuffer(canvas),
      filename: `fixture-${view.league.slug}-r${view.round}-p${pageInfo.page}.png`,
      meta: pageInfo,
    };
  }

  /**
   * @param {import('@napi-rs/canvas').SKRSContext2D} ctx
   */
  drawMatchCard(ctx, block) {
    const { x, y, width, height, row, logos, index, labels } = block;
    const theme = this.theme;

    // Flat row (Sofa minimal). Optional very subtle tint for zebra.
    if (index % 2 === 1) {
      ctx.fillStyle = "rgba(255,255,255,0.01)";
      ctx.fillRect(x, y, width, height);
    }

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Clean center score/time (no glass box)
    setFont(ctx, "scoreMd", theme.textPrimary);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(row.scoreText, centerX, centerY);

    const logoSize = 48;
    const padding = 28;
    const homeLogo = logos.get(row.home.id) ?? null;
    const awayLogo = logos.get(row.away.id) ?? null;

    // Home left
    const homeTextRight = centerX - 64;
    drawTeamLogo(
      ctx,
      x + padding,
      centerY - logoSize / 2,
      logoSize,
      homeLogo,
      row.home,
    );
    drawTextFit(
      ctx,
      row.home.name,
      homeTextRight,
      centerY,
      homeTextRight - (x + padding + logoSize + 12),
      {
        variant: "body",
        color: theme.textPrimary,
        align: "right",
        baseline: "middle",
      },
    );

    // Away right
    const awayTextLeft = centerX + 64;
    drawTeamLogo(
      ctx,
      x + width - padding - logoSize,
      centerY - logoSize / 2,
      logoSize,
      awayLogo,
      row.away,
    );
    drawTextFit(
      ctx,
      row.away.name,
      awayTextLeft,
      centerY,
      x + width - padding - logoSize - 12 - awayTextLeft,
      {
        variant: "body",
        color: theme.textPrimary,
        align: "left",
        baseline: "middle",
      },
    );
  }
}

module.exports = FixtureRenderer;
