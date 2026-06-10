const { drawPanelHeader } = require('../../../canvas/primitives/drawPanelHeader');

/** @deprecated name kept for imports — uses PanelHeader (no side stripe). */
function drawHeader(ctx, block, theme) {
    drawPanelHeader(ctx, block, theme);
}

module.exports = { drawHeader, drawPanelHeader };