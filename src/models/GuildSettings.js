const { Schema } = require('mongoose');

// Export schema (not model) per Context7 / Mongoose best practices.
// This allows flexible connection usage and avoids default-connection scoping issues.
module.exports = new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  prefix: {
    type: String,
    default: '?'
  },
  defaultLocale: {
    type: String,
    default: null
  }
}, {
  timestamps: true, // createdAt / updatedAt
  versionKey: false
});
