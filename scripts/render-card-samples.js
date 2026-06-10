/**
 * Renders sample match / standings / fixture PNGs for visual QA.
 * Usage: node scripts/render-card-samples.js
 */
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { createSvgRenderer } = require('../dist/graphics/adapters');
const { buildStandingsView } = require('../src/league/render/data/standingsView');
const { buildFixtureView } = require('../src/league/render/data/fixtureView');
const { buildMatchResultView } = require('../src/league/render/data/matchResultView');
const { buildTeamListView } = require('../src/league/render/data/teamListView');
const { MATCH_STATUS } = require('../src/league/constants/matchStatus');

const oid = (suffix) => `0000000000000000000000${suffix}`;
const outDir = path.join(__dirname, '..', 'output', 'samples');

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const league = { _id: oid('aa'), name: 'Super Lig', slug: 'super-lig', season: 1, totalRounds: 6, format: 'single_round_robin' };
  const teamMap = new Map([
    [oid('01'), { _id: oid('01'), name: 'Galatasaray', shortName: 'GS', colors: { primary: '#ff0000' } }],
    [oid('02'), { _id: oid('02'), name: 'Fenerbahce', shortName: 'FB', colors: { primary: '#ffff00' } }],
    [oid('03'), { _id: oid('03'), name: 'Besiktas', shortName: 'BJK', colors: { primary: '#000000' } }],
  ]);

  const match = {
    _id: oid('m1'),
    round: 3,
    homeTeamId: oid('01'),
    awayTeamId: oid('02'),
    status: MATCH_STATUS.COMPLETED,
    score: { home: 2, away: 1 },
  };
  const matchView = buildMatchResultView(league, match, teamMap);
  const matchPng = await createSvgRenderer('match_result').render(matchView);
  fs.writeFileSync(path.join(outDir, matchPng.filename), matchPng.buffer);
  console.log('Wrote', matchPng.filename);

  const standing = {
    version: 2,
    calculatedAt: new Date(),
    entries: [
      { teamId: oid('01'), rank: 1, played: 3, won: 2, drawn: 1, lost: 0, gf: 5, ga: 2, gd: 3, points: 7, form: ['W', 'D', 'W'] },
      { teamId: oid('02'), rank: 2, played: 3, won: 2, drawn: 0, lost: 1, gf: 4, ga: 3, gd: 1, points: 6, form: ['W', 'L', 'W'] },
      { teamId: oid('03'), rank: 3, played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 3, gd: 0, points: 4, form: ['D', 'W', 'L'] },
    ],
  };
  const standingsView = buildStandingsView(league, standing, teamMap);
  const standingsPng = await createSvgRenderer('standings').render(standingsView);
  fs.writeFileSync(path.join(outDir, standingsPng.filename), standingsPng.buffer);
  console.log('Wrote', standingsPng.filename);

  const matches = [
    { _id: oid('m1'), round: 2, leg: 1, homeTeamId: oid('01'), awayTeamId: oid('02'), status: MATCH_STATUS.COMPLETED, score: { home: 2, away: 1 } },
    { _id: oid('m2'), round: 2, leg: 1, homeTeamId: oid('03'), awayTeamId: oid('01'), status: MATCH_STATUS.SCHEDULED, score: null },
  ];
  const teams = [...teamMap.values()].map((team) => ({
    _id: team._id,
    name: team.name,
    shortName: team.shortName,
    captainId: team._id === oid('01') ? 'captain-user' : null,
    roleId: team._id === oid('02') ? 'role-id' : null,
    colors: team.colors,
    logoUrl: null,
  }));
  const captainLabels = new Map([[oid('01'), 'Icardi']]);
  const roleLabels = new Map([[oid('02'), 'Sarı Lacivert']]);
  const teamsView = buildTeamListView(league, teams, { captainLabels, roleLabels });
  const teamsPng = await createSvgRenderer('team_list').render(teamsView);
  fs.writeFileSync(path.join(outDir, teamsPng.filename), teamsPng.buffer);
  console.log('Wrote', teamsPng.filename);

  const fixtureView = buildFixtureView(league, 2, matches, teamMap, []);
  const fixturePng = await createSvgRenderer('fixture').render(fixtureView);
  fs.writeFileSync(path.join(outDir, fixturePng.filename), fixturePng.buffer);
  console.log('Wrote', fixturePng.filename);

  console.log('Samples in', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});