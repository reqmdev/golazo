const Event = require('../../structure/Event');
const { handleGuildDelete } = require('../../services/guildLifecycle');

module.exports = new Event({
    event: 'guildDelete',
    run: async (client, guild) => {
        await handleGuildDelete(client, guild);
    }
}).toJSON();