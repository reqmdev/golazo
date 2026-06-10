const AUDIT_ACTION = {
    LEAGUE_CREATE: 'league.create',
    TEAM_ADD: 'team.add',
    TEAM_REMOVE: 'team.remove',
    TEAM_EDIT: 'team.edit',
    FIXTURE_GENERATE: 'fixture.generate',
    FIXTURE_REGENERATE: 'fixture.regenerate',
    MATCH_SUBMIT: 'match.submit',
    MATCH_CORRECT: 'match.correct',
    MATCH_FORFEIT: 'match.forfeit',
    MATCH_POSTPONE: 'match.postpone',
    MATCH_CANCEL: 'match.cancel',
    MATCH_RESUME: 'match.resume',
    STANDINGS_RECOVER: 'standings.recover',
    LEAGUE_RESET: 'league.reset',
    SETTINGS_UPDATE: 'settings.update',
    PERMISSIONS_UPDATE: 'permissions.update'
};

module.exports = { AUDIT_ACTION };