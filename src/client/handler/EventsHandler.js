const { info, error, success } = require('../../utils/Console');
const { clearModuleCache } = require('../../utils/clearModuleCache');
const { readdirSync } = require('fs');
const DiscordBot = require('../DiscordBot');
const Event = require('../../structure/Event');

class EventsHandler {
    client;
    /** @type {{ event: string, handler: (...args: unknown[]) => void }[]} */
    loadedListeners = [];

    /**
     *
     * @param {DiscordBot} client 
     */
    constructor(client) {
        this.client = client;
    }

    load = () => {
        let total = 0;

        for (const directory of readdirSync('./src/events/')) {
            for (const file of readdirSync('./src/events/' + directory).filter((f) => f.endsWith('.js'))) {
                try {
                    /**
                     * @type {Event['data']}
                     */
                    const module = require('../../events/' + directory + '/' + file);

                    if (!module) continue;

                    if (module.__type__ === 5) {
                        if (!module.event || !module.run) {
                            error('Unable to load the event ' + file);
                            continue;
                        }

                        const handler = (...args) => module.run(this.client, ...args);

                        if (module.once) {
                            this.client.once(module.event, handler);
                        } else {
                            this.client.on(module.event, handler);
                        }

                        this.loadedListeners.push({ event: module.event, handler });

                        info(`Loaded new event: ` + file);

                        total++;
                    } else {
                        error('Invalid event type ' + module.__type__ + ' from event file ' + file);
                    }
                } catch (err) {
                    error('Unable to load an event from the path: ' + 'src/events/' + directory + '/' + file);
                }
            }
        }

        success(`Successfully loaded ${total} events.`);
    }

    reload = () => {
        for (const { event, handler } of this.loadedListeners) {
            this.client.removeListener(event, handler);
        }

        this.loadedListeners = [];

        clearModuleCache('/src/events/');
        clearModuleCache('/src/structure/');

        this.load();
    }
}

module.exports = EventsHandler;