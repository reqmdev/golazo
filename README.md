# Golazo ⚽

[![CI](https://github.com/reqmdev/golazo/actions/workflows/ci.yml/badge.svg)](https://github.com/reqmdev/golazo/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)

Open-source Discord bot for amateur football leagues — fixtures, live scores, standings, and team management with modern sports-card visuals.

## Features

- Round-robin fixture generation (single / double)
- Interactive fixture & standings cards (Components V2 + PNG/SVG renders)
- Score entry with modal + week/page navigation
- Standings rebuild, score correction, walkover/forfeit
- Match postpone / cancel / resume
- Announcement channel for new results
- League permissions (owner, admin, score reporter)
- Audit log with TTL
- Turkish & English (`/language`)
- Docker + health checks + Prometheus metrics

## Quick start (server admin)

1. Invite Golazo with `applications.commands` and `Send Messages` permissions.
2. `/league create name:Sunday League` — save the **league code** (slug).
3. `/league team add league:…` — register teams.
4. `/league fixture generate league:…`
5. `/league fixture show league:…` — browse weeks with buttons.
6. `/league score league:…` — pick a match, enter goals in the modal.
7. `/league standings league:…`
8. Optional: `/league settings channel league:… announcements:#results`

Type `league` in any `/league` command — autocomplete lists leagues in your server.

## Self-hosting

### Requirements

- **Node.js 20+**
- **MongoDB** (replica set recommended for transactions — included in Docker Compose)

### Setup

```bash
git clone https://github.com/reqmdev/golazo.git
cd golazo
cp .env.example .env
# Edit .env — set CLIENT_TOKEN, MONGODB_URI, GOLAZO_OWNER_ID
npm install
npm test
npm run start:prod
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `CLIENT_TOKEN` | Yes | Discord bot token |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `GOLAZO_OWNER_ID` | Yes | Discord user ID of the bot operator |
| `GOLAZO_DEVELOPER_IDS` | No | Comma-separated developer IDs |
| `GOLAZO_ENABLE_DEV_COMMANDS` | No | `false` in production (default) |
| `GOLAZO_DEV_MODE` | No | `true` for guild-only slash commands while developing |
| `GOLAZO_HEALTH_PORT` | No | HTTP port for `/health`, `/ready`, `/metrics` |
| `GOLAZO_GUILD_LEAVE_DATA_POLICY` | No | `cache_only` (default), `archive`, or `delete` |

See [`.env.example`](.env.example) for the full list.

### Cloud (Render / Railway / Fly)

1. Connect the GitHub repo in your hosting dashboard.
2. Set **secret** environment variables: `CLIENT_TOKEN`, `MONGODB_URI`, `GOLAZO_OWNER_ID`.
3. Use **Web** service (not static) — the bot exposes `/health` on the platform `PORT`.
4. Build: `npm ci && npm run build:graphics && node scripts/sync-fonts.js && node scripts/sync-canvas-assets.js`
5. Start: `node .`

Included configs: [`render.yaml`](render.yaml), [`railway.toml`](railway.toml), [`Procfile`](Procfile).

### Docker

```bash
cp .env.example .env
# Set CLIENT_TOKEN and GOLAZO_OWNER_ID in .env
npm run docker:up
```

Health: `http://localhost:8080/health` · Metrics: `http://localhost:8080/metrics`

### Production checklist

- Set `GOLAZO_ENABLE_DEV_COMMANDS=false`
- Leave `GOLAZO_DEV_MODE` unset or `false` for global slash commands
- Use a MongoDB replica set (Atlas or the included Compose stack)
- Enable `GOLAZO_HEALTH_PORT` and scrape `/metrics`
- Optional: `GOLAZO_ERROR_WEBHOOK` for crash alerts
- Optional: `npm run start:sharded` for large guild counts

## Development

```bash
npm install
npm test
npm start
```

Guild-only commands during development:

```env
GOLAZO_DEV_MODE=true
GOLAZO_DEV_GUILD_ID=your_test_guild_id
```

Then restart the bot or run `npm run register-commands`.

## Privacy & data

- League data is stored per Discord server in MongoDB (teams, matches, standings).
- When the bot leaves a guild, in-memory caches are cleared. Configure `GOLAZO_GUILD_LEAVE_DATA_POLICY` to archive or delete persisted data.
- Team logo URLs are fetched only when rendering cards; private network URLs are blocked.

## Contributing

Contributions are welcome! Please open an issue before large changes.

1. Fork the repository
2. Create a feature branch
3. Run `npm test`
4. Open a pull request

## Security

Do not commit `.env` or Discord tokens. Report security issues privately to the repository maintainer rather than opening a public issue.

## Tech stack

- [discord.js](https://discord.js.org/) v14 + Components V2
- MongoDB (Mongoose 8)
- SVG/Canvas render pipeline (`@resvg/resvg-js`, `@napi-rs/canvas`)
- TypeScript graphics module compiled to `dist/graphics`

## License

[GNU General Public License v3.0](LICENSE) — see [LICENSE](LICENSE) for details.