const Event = require("../../structure/Event");
const { info } = require("../../utils/Console");

module.exports = new Event({
    event: 'threadCreate',
    run: (client, thread) => {
        info(`Golazo detected new thread: #${thread.name} in ${thread.parent?.name || 'unknown'} (id: ${thread.id})`);
        // Can auto-join, send starter message, etc.
    }
}).toJSON();
