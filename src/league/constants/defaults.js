const DEFAULT_POINTS = {
    win: 3,
    draw: 1,
    loss: 0
};

const DEFAULT_TEAM_LIMITS = {
    minTeams: 2,
    maxTeams: 20
};

const DEFAULT_TIEBREAKERS = ['points', 'gd', 'gf', 'head_to_head'];

const ALLOWED_TIEBREAKERS = ['points', 'gd', 'gf', 'head_to_head', 'team_id'];

const DEFAULT_FORFEIT_SCORE = {
    winnerGoals: 3,
    loserGoals: 0
};

const MAX_LEAGUES_PER_GUILD = 10;
const MAX_TEAM_NAME_LENGTH = 32;
const MAX_SHORT_NAME_LENGTH = 4;

module.exports = {
    DEFAULT_POINTS,
    DEFAULT_TEAM_LIMITS,
    DEFAULT_TIEBREAKERS,
    ALLOWED_TIEBREAKERS,
    DEFAULT_FORFEIT_SCORE,
    MAX_LEAGUES_PER_GUILD,
    MAX_TEAM_NAME_LENGTH,
    MAX_SHORT_NAME_LENGTH
};