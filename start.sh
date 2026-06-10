#!/usr/bin/env bash
# Bot-Hosting / Pterodactyl: set Startup to "bash start.sh" if index.js is missing.
cd "$(dirname "$0")"
exec node src/index.js