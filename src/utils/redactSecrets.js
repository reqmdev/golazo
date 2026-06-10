/**
 * Strip secrets from strings before logging or sending to webhooks.
 *
 * @param {string} text
 * @returns {string}
 */
function redactSecrets(text) {
    if (!text) {
        return text;
    }

    let result = String(text);

    const secrets = [
        process.env.CLIENT_TOKEN,
        process.env.MONGODB_URI,
        process.env.GOLAZO_ERROR_WEBHOOK,
    ].filter((value) => typeof value === 'string' && value.length > 0);

    for (const secret of secrets) {
        result = result.split(secret).join('[REDACTED]');
    }

    result = result.replace(/mongodb(\+srv)?:\/\/[^\s'"]+/gi, '[REDACTED_MONGODB_URI]');
    result = result.replace(/https:\/\/discord\.com\/api\/webhooks\/[^\s'"]+/gi, '[REDACTED_WEBHOOK]');
    result = result.replace(/[\w-]{23,}\.[\w-]{5,}\.[\w-]{25,}/g, '[REDACTED_TOKEN]');

    return result;
}

module.exports = { redactSecrets };