const { Schema } = require('mongoose');
const { LEAGUE_STATUS } = require('../constants/leagueStatus');
const { LEAGUE_FORMAT } = require('../constants/leagueFormat');
const { DEFAULT_POINTS, DEFAULT_TEAM_LIMITS, DEFAULT_TIEBREAKERS } = require('../constants/defaults');

const leagueSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 64
    },
    status: {
        type: String,
        enum: Object.values(LEAGUE_STATUS),
        default: LEAGUE_STATUS.REGISTRATION
    },
    format: {
        type: String,
        enum: Object.values(LEAGUE_FORMAT),
        required: true
    },
    settings: {
        pointsWin: { type: Number, default: DEFAULT_POINTS.win },
        pointsDraw: { type: Number, default: DEFAULT_POINTS.draw },
        pointsLoss: { type: Number, default: DEFAULT_POINTS.loss },
        minTeams: { type: Number, default: DEFAULT_TEAM_LIMITS.minTeams },
        maxTeams: { type: Number, default: DEFAULT_TEAM_LIMITS.maxTeams }
    },
    tiebreakers: {
        type: [String],
        default: () => [...DEFAULT_TIEBREAKERS]
    },
    permissions: {
        ownerId: { type: String, required: true },
        adminIds: { type: [String], default: [] },
        scoreReporterIds: { type: [String], default: [] }
    },
    channels: {
        announcementsChannelId: { type: String, default: null }
    },
    season: {
        type: Number,
        default: 1
    },
    currentRound: {
        type: Number,
        default: 0
    },
    totalRounds: {
        type: Number,
        default: 0
    },
    fixtureGeneratedAt: {
        type: Date,
        default: null
    },
    fixtureVersion: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

leagueSchema.index({ guildId: 1, slug: 1 }, { unique: true });
leagueSchema.index({ guildId: 1, status: 1 });

module.exports = leagueSchema;