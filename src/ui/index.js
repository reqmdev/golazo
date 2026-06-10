const tokens = require('./tokens');
const emoji = require('./emoji');
const EmbedFactory = require('./EmbedFactory');
const ReplyService = require('./ReplyService');
const assets = require('./assets');

module.exports = {
    ...tokens,
    ...emoji,
    ...EmbedFactory,
    ...ReplyService,
    ...assets
};