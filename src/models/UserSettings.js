const { Schema } = require('mongoose');

module.exports = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    locale: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});