const { Schema } = require('mongoose');

const leagueOperationLockSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    }
}, {
    timestamps: false,
    versionKey: false
});

leagueOperationLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = leagueOperationLockSchema;