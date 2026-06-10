const { clearRenderCacheByLeagueId } = require('../render/core/RenderCache');
const { clearTeamMapCache } = require('../utils/teamMap');
const { clearAvatarUrlCache } = require('../utils/resolveTeamLogoUrl');

/**
 * Invalidate materialized render outputs for a league.
 *
 * @param {string} leagueId
 */
function invalidateLeagueRenderCache(leagueId) {
    clearRenderCacheByLeagueId(leagueId);
    clearTeamMapCache(leagueId);
    clearAvatarUrlCache();
}

module.exports = {
    invalidateLeagueRenderCache
};