const { Schema } = require('mongoose');

const standingEntrySchema = new Schema({
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    gf: { type: Number, default: 0 },
    ga: { type: Number, default: 0 },
    gd: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    form: { type: [String], default: [] }
}, { _id: false });

const standingSchema = new Schema({
    leagueId: {
        type: Schema.Types.ObjectId,
        ref: 'League',
        required: true,
        unique: true
    },
    guildId: {
        type: String,
        required: true,
        index: true
    },
    entries: {
        type: [standingEntrySchema],
        default: []
    },
    calculatedAt: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = standingSchema;