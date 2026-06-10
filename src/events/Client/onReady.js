const { success } = require("../../utils/Console");
const Event = require("../../structure/Event");
const { initRenderEngine } = require("../../league/render/core/RendererFactory");

module.exports = new Event({
    event: 'ready',
    once: true,
    run: (__client__, client) => {
        initRenderEngine();
        success('Golazo online as ' + client.user.displayName + ' (took ' + ((Date.now() - __client__.login_timestamp) / 1000) + "s). Ready to score goals!")
    }
}).toJSON();