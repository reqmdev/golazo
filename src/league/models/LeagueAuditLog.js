const { Schema } = require('mongoose');

const leagueAuditLogSchema = new Schema({
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
    actorId: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    summary: {
        type: String,
        required: true,
        maxlength: 512
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
});

leagueAuditLogSchema.index({ leagueId: 1, createdAt: -1 });

const auditTtlSeconds = Number(process.env.GOLAZO_AUDIT_TTL_SECONDS) || 365 * 24 * 60 * 60;

if (auditTtlSeconds > 0) {
    leagueAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: auditTtlSeconds });
}

module.exports = leagueAuditLogSchema;