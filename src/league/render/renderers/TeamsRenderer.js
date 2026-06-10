const BaseRenderer = require('./BaseRenderer');

class TeamsRenderer extends BaseRenderer {
    /**
     * @param {ReturnType<import('../data/teamListView').buildTeamListView>} view
     */
    async render(view) {
        const { createSvgRenderer } = require('../../../../dist/graphics/adapters');
        return createSvgRenderer('team_list').render(view);
    }
}

module.exports = TeamsRenderer;