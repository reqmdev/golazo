const { createTranslator } = require('../../i18n');

/**
 * @param {Function} [tr]
 */
function resolveTr(tr) {
    return tr || createTranslator('en');
}

/**
 * @param {object[]} entries
 * @param {Function} [tr]
 */
function formatAuditLog(entries, tr) {
    const t = resolveTr(tr);

    if (!entries.length) {
        return t('format.audit.empty');
    }

    return entries.map((entry) => {
        const when = entry.createdAt
            ? `<t:${Math.floor(new Date(entry.createdAt).getTime() / 1000)}:R>`
            : t('common.emDash');
        return t('format.audit.entry', {
            when,
            action: entry.action,
            actor: `<@${entry.actorId}>`,
            summary: entry.summary
        });
    }).join('\n');
}

module.exports = { formatAuditLog };