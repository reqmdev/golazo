const BaseRenderer = require("./BaseRenderer");
const { LAYOUT } = require("../constants/layout");
const { createRenderCanvas } = require("../core/CanvasFactory");
const { drawHeader, drawTeamLogo } = require("../drawing");
const { drawTextFit } = require("../drawing/drawTextFit");
const { setFont } = require("../utils/typography");

// SofaScore-style hero (no glass card height constant; derived from LAYOUT)

function computeMatchResultHeight() {
  return (
    LAYOUT.padding * 2 +
    LAYOUT.headerHeight +
    LAYOUT.headerGap +
    LAYOUT.matchHeroHeight
  );
}

class MatchResultRenderer extends BaseRenderer {
  /**
   * @param {ReturnType<import('../data/matchResultView').buildMatchResultView>} view
   */
  async render(view) {
    const labels = view.labels;
    const logos = await this.loadLogos([view.home, view.away]);
    const height = computeMatchResultHeight();
    const { canvas, ctx, width } = createRenderCanvas(LAYOUT.width, height);
    await this.paintBackground(ctx, width, height, "hero");

    const contentWidth = width - LAYOUT.padding * 2;
    let y = LAYOUT.padding;

    drawHeader(
      ctx,
      {
        x: LAYOUT.padding,
        y,
        width: contentWidth,
        height: LAYOUT.headerHeight,
        title: view.league.name,
        subtitle: labels.subtitle,
        badge: view.match.resultLabel,
      },
      this.theme,
    );

    y += LAYOUT.headerHeight + LAYOUT.headerGap;

    // === SofaScore horizontal hero (flat, clean, data-first) ===
    const heroY = y;
    const centerX = width / 2;
    const midY = heroY + LAYOUT.matchHeroHeight / 2;

    const logoSize = LAYOUT.heroLogoSize;
    const gap = 28; // breathing room

    // Home (left)
    const homeLogoX = LAYOUT.padding + 24;
    const homeNameMax = 210;

    drawTeamLogo(
      ctx,
      homeLogoX,
      midY - logoSize / 2,
      logoSize,
      logos.get(view.home.id) ?? null,
      view.home,
    );

    const homeNameX = homeLogoX + logoSize + 14;
    drawTextFit(ctx, view.home.name, homeNameX, midY - 6, homeNameMax, {
      variant: "title",
      color:
        view.match.winner === "home"
          ? this.theme.textPrimary
          : this.theme.textSecondary,
      align: "left",
      baseline: "middle",
    });

    // Winner marker under home name (subtle, pro)
    if (view.match.winner === "home") {
      ctx.fillStyle = this.theme.accent;
      ctx.beginPath();
      ctx.roundRect(homeNameX, midY + 18, 28, 5, 2);
      ctx.fill();
    }

    // Away (right)
    const awayLogoX = LAYOUT.padding + contentWidth - logoSize - 24;
    const awayNameMax = 210;

    drawTeamLogo(
      ctx,
      awayLogoX,
      midY - logoSize / 2,
      logoSize,
      logos.get(view.away.id) ?? null,
      view.away,
    );

    const awayNameRight = awayLogoX - 14;
    drawTextFit(ctx, view.away.name, awayNameRight, midY - 6, awayNameMax, {
      variant: "title",
      color:
        view.match.winner === "away"
          ? this.theme.textPrimary
          : this.theme.textSecondary,
      align: "right",
      baseline: "middle",
    });

    if (view.match.winner === "away") {
      ctx.fillStyle = this.theme.accent;
      ctx.beginPath();
      ctx.roundRect(awayNameRight - 28, midY + 18, 28, 5, 2);
      ctx.fill();
    }

    // Center score (large, confident, mono — the star of the card)
    const scoreCenterX = centerX;
    setFont(ctx, "scoreLg", this.theme.textPrimary);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(view.match.scoreText, scoreCenterX, midY - 4);

    // Subtle status chip under/beside score (FT, LIVE, WO...)
    const statusY = midY + 32;
    setFont(ctx, "chip", this.theme.textMuted);
    ctx.textAlign = "center";
    ctx.fillText(view.match.resultLabel || "FT", scoreCenterX, statusY);

    this.drawWatermark(
      ctx,
      LAYOUT.padding,
      height - 10,
      contentWidth,
      "Golazo",
    );

    return {
      buffer: this.toBuffer(canvas),
      filename: `result-${view.league.slug}-r${view.match.round}.png`,
      meta: { matchId: view.match.id },
    };
  }
}

module.exports = MatchResultRenderer;
