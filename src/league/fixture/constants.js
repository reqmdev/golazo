/** Internal sentinel for Berger bye slot — never persisted to DB. */
const BYE = '__BYE__';

/** Extensible competition phases for league / cup / playoff / groups. */
const COMPETITION_PHASE = {
    LEAGUE: 'league',
    CUP: 'cup',
    PLAYOFF: 'playoff',
    GROUP: 'group',
    CHAMPIONS_GROUP: 'champions_group',
    CHAMPIONS_KNOCKOUT: 'champions_knockout',
};

/** Match statuses that block fixture regeneration. */
const FIXTURE_LOCK_STATUSES = ['completed', 'walkover', 'live'];

/** Statuses removed on safe fixture regeneration. */
const FIXTURE_REMOVABLE_STATUSES = ['scheduled', 'postponed', 'cancelled'];

module.exports = {
    BYE,
    COMPETITION_PHASE,
    FIXTURE_LOCK_STATUSES,
    FIXTURE_REMOVABLE_STATUSES
};