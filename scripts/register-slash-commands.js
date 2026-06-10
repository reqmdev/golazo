/**
 * Push slash command definitions to Discord (no bot login required).
 * Usage: node scripts/register-slash-commands.js
 */
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { readdirSync } = require('fs');
const config = require('../src/config');
const { applySlashLocalizations } = require('../src/i18n/discordLocalizations');

async function main() {
    if (!process.env.CLIENT_TOKEN) {
        throw new Error('CLIENT_TOKEN is missing in .env');
    }

    const commands = [];

    for (const directory of readdirSync('./src/commands/')) {
        for (const file of readdirSync(`./src/commands/${directory}`).filter((f) => f.endsWith('.js'))) {
            const module = require(`../src/commands/${directory}/${file}`);
            if (module.__type__ === 1 && module.command) {
                commands.push(applySlashLocalizations(module.command));
            }
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.CLIENT_TOKEN);
    const app = await rest.get(Routes.oauth2CurrentApplication());
    const appId = app.id;

    if (config.development.enabled) {
        await rest.put(
            Routes.applicationGuildCommands(appId, config.development.guildId),
            { body: commands },
        );
        console.log(`Registered ${commands.length} guild commands → ${config.development.guildId}`);
    } else {
        await rest.put(Routes.applicationCommands(appId), { body: commands });
        console.log(`Registered ${commands.length} global commands`);
    }

    const league = commands.find((cmd) => cmd.name === 'league');
    const teamList = league?.options
        ?.find((entry) => entry.name === 'team')
        ?.options?.find((entry) => entry.name === 'list');

    console.log('League subcommands:', league?.options?.map((entry) => entry.name).join(', '));
    console.log('team list options:', teamList?.options?.map((entry) => entry.name).join(', ') || 'n/a');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});