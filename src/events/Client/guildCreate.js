const Event = require("../../structure/Event");
const { info } = require("../../utils/Console");

module.exports = new Event({
    event: 'guildCreate',
    run: async (client, guild) => {
        info(`Golazo joined a new guild: ${guild.name} (${guild.id}) — members: ${guild.memberCount}`);

        const { sendGuildWelcome } = require('../../onboarding/guildWelcome');
        await sendGuildWelcome(guild);
    }
}).toJSON();
