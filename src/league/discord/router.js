const { runLeagueInteraction } = require('./interactionRunner');
const {
    handleCreate,
    handleList,
    handleFixture,
    handleTeam,
    handleScore,
    handleScoreCorrect,
    handleForfeit,
    handleStandings,
    handleSettings,
    handleAudit,
    handleRollback,
    handleReset,
    handleMatch,
    handleChampions,
    lockKeyFor,
    needsDefer
} = require('./handlers');

/**
 * @param {import('../../client/DiscordBot')} client
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function routeLeagueCommand(client, interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    await runLeagueInteraction(interaction, client, {
        defer: needsDefer(subcommand, subcommandGroup, interaction),
        lockKey: lockKeyFor(interaction, subcommand, subcommandGroup)
    }, async (ix, ctx) => {
        if (subcommandGroup === 'fixture') {
            await handleFixture(ix, subcommand, ctx);
            return;
        }

        if (subcommandGroup === 'team') {
            await handleTeam(ix, subcommand, ctx);
            return;
        }

        if (subcommandGroup === 'settings') {
            await handleSettings(ix, subcommand, ctx);
            return;
        }

        if (subcommandGroup === 'rollback') {
            await handleRollback(ix, ctx);
            return;
        }

        if (subcommandGroup === 'match') {
            await handleMatch(ix, subcommand, ctx);
            return;
        }

        if (subcommandGroup === 'champions') {
            await handleChampions(ix, subcommand, null, ctx);
            return;
        }

        if (subcommandGroup === 'champions-settings') {
            await handleChampions(ix, subcommand, 'settings', ctx);
            return;
        }

        switch (subcommand) {
            case 'create':
                await handleCreate(ix, ctx);
                break;
            case 'list':
                await handleList(ix, ctx);
                break;
            case 'score':
                await handleScore(ix, ctx);
                break;
            case 'score-correct':
                await handleScoreCorrect(ix, ctx);
                break;
            case 'forfeit':
                await handleForfeit(ix, ctx);
                break;
            case 'standings':
                await handleStandings(ix, ctx);
                break;
            case 'audit':
                await handleAudit(ix, ctx);
                break;
            case 'reset':
                await handleReset(ix, ctx);
                break;
            default:
                throw new Error(`Unknown league subcommand: ${subcommand}`);
        }
    });
}

module.exports = { routeLeagueCommand };