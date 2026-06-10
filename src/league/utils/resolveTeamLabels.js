/**
 * Resolve Discord captain usernames and guild role names for team list cards.
 *
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').Guild | null} guild
 * @param {object[]} teams
 * @param {(key: string, params?: object) => string} tr
 */
async function resolveTeamDisplayLabels(client, guild, teams, tr) {
    const captainLabels = new Map();
    const roleLabels = new Map();
    const unknownCaptain = tr('render.teams.unknownCaptain');
    const unknownRole = tr('render.teams.unknownRole');

    await Promise.all(teams.map(async (team) => {
        const id = team._id.toString();

        if (team.captainId) {
            try {
                const user = await client.users.fetch(team.captainId);
                captainLabels.set(id, user.globalName || user.username);
            } catch {
                captainLabels.set(id, unknownCaptain);
            }
        }

        if (team.roleId) {
            const role = guild?.roles?.cache?.get(team.roleId);
            roleLabels.set(id, role?.name || unknownRole);
        }
    }));

    return { captainLabels, roleLabels };
}

module.exports = { resolveTeamDisplayLabels };