/**
 * Backfill Team.nameLower for documents created before the field was required.
 *
 * Usage: node scripts/migrate-team-name-lower.js
 * Requires MONGODB_URI in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const teamSchema = require('../src/league/models/Team');

async function main() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('MONGODB_URI is not set.');
        process.exit(1);
    }

    await mongoose.connect(uri);
    const Team = mongoose.model('Team', teamSchema);

    const missing = await Team.find({
        $or: [
            { nameLower: { $exists: false } },
            { nameLower: null },
            { nameLower: '' }
        ]
    }).select('_id name').lean();

    if (missing.length === 0) {
        console.log('No teams need nameLower backfill.');
        await mongoose.disconnect();
        return;
    }

    let updated = 0;
    let failed = 0;

    for (const team of missing) {
        const nameLower = (team.name || '').trim().toLowerCase();

        if (!nameLower) {
            console.warn(`Skipping team ${team._id}: empty name`);
            failed += 1;
            continue;
        }

        try {
            await Team.updateOne({ _id: team._id }, { $set: { nameLower } });
            updated += 1;
        } catch (err) {
            failed += 1;
            console.warn(`Failed ${team._id} (${team.name}): ${err.message}`);
        }
    }

    console.log(`nameLower migration complete — updated: ${updated}, failed: ${failed}`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});