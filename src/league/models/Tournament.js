const { Schema } = require('mongoose');
const { TOURNAMENT_STATUS, TOURNAMENT_TYPE, TOURNAMENT_PHASE } = require('../constants/tournamentStatus');

const qualifiedTeamSchema = new Schema({
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    leagueRank: { type: Number, required: true },
    seed: { type: Number, required: true },
}, { _id: false });

const groupSchema = new Schema({
    id: { type: String, required: true },
    teamIds: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
}, { _id: false });

const knockoutTieSchema = new Schema({
    tieId: { type: String, required: true },
    round: { type: String, required: true },
    slot: { type: Number, required: true },
    teamAId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    teamBId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    winnerId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    isBye: { type: Boolean, default: false },
}, { _id: false });

const tournamentSchema = new Schema({
    leagueId: {
        type: Schema.Types.ObjectId,
        ref: 'League',
        required: true,
        index: true,
    },
    guildId: {
        type: String,
        required: true,
        index: true,
    },
    season: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(TOURNAMENT_TYPE),
        default: TOURNAMENT_TYPE.CHAMPIONS_LEAGUE,
    },
    status: {
        type: String,
        enum: Object.values(TOURNAMENT_STATUS),
        default: TOURNAMENT_STATUS.PENDING,
    },
    format: {
        templateId: { type: String, required: true },
        groupCount: { type: Number, default: 0 },
        teamsPerGroup: { type: Number, default: 0 },
        knockoutSize: { type: Number, default: 0 },
        qualifiersPerGroup: { type: Number, default: 2 },
        skipGroupStage: { type: Boolean, default: false },
    },
    qualifiedTeams: {
        type: [qualifiedTeamSchema],
        default: [],
    },
    groups: {
        type: [groupSchema],
        default: [],
    },
    knockoutTies: {
        type: [knockoutTieSchema],
        default: [],
    },
    currentPhase: {
        type: String,
        enum: Object.values(TOURNAMENT_PHASE),
        default: null,
    },
    currentKnockoutRound: {
        type: String,
        default: null,
    },
    currentGroupRound: {
        type: Number,
        default: 0,
    },
    winnerTeamId: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});

tournamentSchema.index({ leagueId: 1, season: 1 }, { unique: true });
tournamentSchema.index({ guildId: 1, status: 1 });

module.exports = tournamentSchema;
