const LEAGUE_STATUS = {
    DRAFT: 'draft',
    REGISTRATION: 'registration',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived'
};

/** Statuses where teams can still be added or edited. */
const TEAM_EDITABLE_STATUSES = [
    LEAGUE_STATUS.DRAFT,
    LEAGUE_STATUS.REGISTRATION,
    LEAGUE_STATUS.ACTIVE
];

module.exports = { LEAGUE_STATUS, TEAM_EDITABLE_STATUSES };