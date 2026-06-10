const fs = require('fs');
const { redactSecrets } = require('./redactSecrets');
const { incrementCounter } = require('../metrics/registry');

/**
 * @param {unknown} err
 * @param {string} [context]
 */
async function reportError(err, context = 'uncaught') {
    incrementCounter('golazo_errors_total');
    incrementCounter(`golazo_errors_${context.replace(/[^a-zA-Z0-9_]/g, '_')}_total`);

    const timestamp = new Date().toISOString();
    const rawMessage = err instanceof Error ? err.stack || err.message : String(err);
    const message = redactSecrets(rawMessage);
    const line = `[${timestamp}] [${context}] ${message}\n`;

    try {
        fs.appendFile('./terminal.log', line, 'utf-8', () => {});
    } catch {
        // ignore log write failures
    }

    const webhook = process.env.GOLAZO_ERROR_WEBHOOK;

    if (!webhook) {
        return;
    }

    try {
        const body = JSON.stringify({
            content: `**Golazo ${context}**\n\`\`\`\n${message.slice(0, 1800)}\n\`\`\``,
        });

        await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });
    } catch {
        // webhook is best-effort
    }
}

module.exports = { reportError };