const { MATCH_STATUS } = require('../constants/matchStatus');

/** Statuses that contribute to standings (rebuild-only, never incremental). */
const STANDINGS_ELIGIBLE_STATUSES = [
    MATCH_STATUS.COMPLETED,
    MATCH_STATUS.WALKOVER
];

/** Statuses a new result can be submitted into. */
const SUBMITTABLE_STATUSES = [
    MATCH_STATUS.SCHEDULED,
    MATCH_STATUS.LIVE,
    MATCH_STATUS.POSTPONED
];

/** Statuses that allow admin score correction (full standings rebuild). */
const CORRECTABLE_STATUSES = [
    MATCH_STATUS.COMPLETED,
    MATCH_STATUS.WALKOVER
];

/** Unresolved for round progression. */
const UNRESOLVED_ROUND_STATUSES = [
    MATCH_STATUS.SCHEDULED,
    MATCH_STATUS.LIVE,
    MATCH_STATUS.POSTPONED
];

module.exports = {
    STANDINGS_ELIGIBLE_STATUSES,
    SUBMITTABLE_STATUSES,
    CORRECTABLE_STATUSES,
    UNRESOLVED_ROUND_STATUSES
};