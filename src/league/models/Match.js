const { Schema } = require('mongoose');
const { MATCH_STATUS } = require('../constants/matchStatus');

const matchSchema = new Schema({
    leagueId: {
        type: Schema.Types.ObjectId,
        ref: 'League',
        required: true,
        index: true
    },
    guildId: {
        type: String,
        required: true,
        index: true
    },
    round: {
        type: Number,
        required: true,
        min: 1
    },
    leg: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    competitionPhase: {
        type: String,
        default: 'league'
    },
    groupId: {
        type: String,
        default: null
    },
    pairingKey: {
        type: String,
        default: null
    },
    tournamentId: {
        type: Schema.Types.ObjectId,
        ref: 'Tournament',
        default: null,
        index: true,
    },
    tieId: {
        type: String,
        default: null,
    },
    knockoutRound: {
        type: String,
        default: null,
    },
    tieBreak: {
        penaltiesHome: { type: Number, default: null },
        penaltiesAway: { type: Number, default: null },
        decidedBy: { type: String, default: null },
    },
    homeTeamId: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    awayTeamId: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: Object.values(MATCH_STATUS),
        default: MATCH_STATUS.SCHEDULED
    },
    score: {
        home: { type: Number, default: null },
        away: { type: Number, default: null }
    },
    resultVersion: {
        type: Number,
        default: 0
    },
    meta: {
        enteredBy: { type: String, default: null },
        enteredAt: { type: Date, default: null },
        editedBy: { type: String, default: null },
        editedAt: { type: Date, default: null },
        editReason: { type: String, default: null },
        walkoverWinnerId: { type: Schema.Types.ObjectId, ref: 'Team', default: null }
    }
}, {
    timestamps: true,
    versionKey: false
});

matchSchema.index({ leagueId: 1, round: 1, leg: 1 });
matchSchema.index({ leagueId: 1, status: 1 });
matchSchema.index(
    { leagueId: 1, leg: 1, round: 1, homeTeamId: 1, awayTeamId: 1 },
    { unique: true, partialFilterExpression: { tournamentId: null } }
);
matchSchema.index(
    { tournamentId: 1, tieId: 1, leg: 1 },
    { unique: true, partialFilterExpression: { tournamentId: { $type: 'objectId' }, tieId: { $type: 'string' } } }
);
matchSchema.index({ tournamentId: 1, knockoutRound: 1, status: 1 });
matchSchema.index({ leagueId: 1, tournamentId: 1, groupId: 1 });

module.exports = matchSchema;