const mongoose = require('mongoose');
const { info, success, error, warn } = require('../utils/Console');

let connectionListenersRegistered = false;

/**
 * Connect to MongoDB using Mongoose.
 * Uses MONGODB_URI from .env (supports local or Atlas).
 * Listens to key connection events (per Context7 recommendations).
 * Models are registered on the default connection after connect.
 */
async function connectMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    error('MONGODB_URI is not set in .env! MongoDB connection aborted.');
    throw new Error('Missing MONGODB_URI');
  }

  // Recommended: use 127.0.0.1 over localhost on newer Node for IPv4/IPv6 reliability.
  mongoose.set('strictQuery', true);

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 20,
      });
    }

    if (!connectionListenersRegistered) {
      mongoose.connection.on('connected', () => {
        success('MongoDB connected successfully.');
      });

      mongoose.connection.on('open', () => {
        info('MongoDB connection open (models ready).');
      });

      mongoose.connection.on('disconnected', () => {
        warn('MongoDB disconnected. Will attempt to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        success('MongoDB reconnected.');
      });

      mongoose.connection.on('error', (err) => {
        error('MongoDB connection error:', err);
      });

      connectionListenersRegistered = true;
    }

    // Register models on the default connection (simple bot pattern)
    // Using export-schema pattern for the schema itself.
    const guildSettingsSchema = require('../models/GuildSettings');
    const userSettingsSchema = require('../models/UserSettings');
    mongoose.model('GuildSettings', guildSettingsSchema);
    mongoose.model('UserSettings', userSettingsSchema);

    const leagueSchema = require('../league/models/League');
    const teamSchema = require('../league/models/Team');
    const matchSchema = require('../league/models/Match');
    const standingSchema = require('../league/models/Standing');
    const leagueAuditLogSchema = require('../league/models/LeagueAuditLog');
    const leagueOperationLockSchema = require('../league/models/LeagueOperationLock');
    mongoose.model('League', leagueSchema);
    mongoose.model('Team', teamSchema);
    mongoose.model('Match', matchSchema);
    mongoose.model('Standing', standingSchema);
    mongoose.model('LeagueAuditLog', leagueAuditLogSchema);
    mongoose.model('LeagueOperationLock', leagueOperationLockSchema);
    const tournamentSchema = require('../league/models/Tournament');
    const tournamentStandingSchema = require('../league/models/TournamentStanding');
    mongoose.model('Tournament', tournamentSchema);
    mongoose.model('TournamentStanding', tournamentStandingSchema);

    const Team = mongoose.model('Team');
    const missingNameLower = await Team.countDocuments({
        $or: [
            { nameLower: { $exists: false } },
            { nameLower: null },
            { nameLower: '' }
        ]
    });

    if (missingNameLower > 0) {
        warn(`${missingNameLower} team(s) missing nameLower — run: npm run migrate:name-lower`);
    }

    success('Golazo MongoDB layer initialized (GuildSettings, League, Team, Match, Standing, Tournament, LeagueAuditLog, LeagueOperationLock models ready).');
  } catch (err) {
    error('Failed to connect to MongoDB:');
    error(err);
    throw err;
  }
}

/**
 * Graceful disconnect (useful for tests or shutdown).
 */
async function disconnectMongo() {
  await mongoose.disconnect();
  info('MongoDB disconnected (graceful).');
}

module.exports = { connectMongo, disconnectMongo };
