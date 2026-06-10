const { Schema } = require('mongoose');

const teamSchema = new Schema({
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
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 32
    },
    nameLower: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        maxlength: 32
    },
    shortName: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 4,
        default: ''
    },
    captainId: {
        type: String,
        default: null
    },
    memberIds: {
        type: [String],
        default: []
    },
    roleId: {
        type: String,
        default: null
    },
    colors: {
        primary: { type: String, default: '#1a472a' },
        secondary: { type: String, default: '#ffffff' }
    },
    logoUrl: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

teamSchema.pre('save', function setNameLower(next) {
    if (this.name) {
        this.nameLower = this.name.trim().toLowerCase();
    }

    next();
});

teamSchema.index({ leagueId: 1, nameLower: 1 }, { unique: true });
teamSchema.index({ leagueId: 1, isActive: 1 });

module.exports = teamSchema;