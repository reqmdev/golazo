const { DASHBOARD_PREFIX } = require('./constants');

/**
 * @param {string} view
 * @param {string} action
 * @param {string} [slug]
 */
function encodeDashboardId(view, action, slug = '') {
    const parts = ['ldb', view, action];

    if (slug) {
        parts.push(slug);
    }

    return parts.join(':');
}

/**
 * @param {string} customId
 * @returns {{ view: string, action: string, slug: string | null } | null}
 */
function parseDashboardId(customId) {
    if (!customId?.startsWith(DASHBOARD_PREFIX)) {
        return null;
    }

    const body = customId.slice(DASHBOARD_PREFIX.length);
    const viewEnd = body.indexOf(':');

    if (viewEnd <= 0) {
        return null;
    }

    const view = body.slice(0, viewEnd);
    const rest = body.slice(viewEnd + 1);
    const actionEnd = rest.indexOf(':');

    if (actionEnd === -1) {
        return { view, action: rest, slug: null };
    }

    return {
        view,
        action: rest.slice(0, actionEnd),
        slug: rest.slice(actionEnd + 1) || null,
    };
}

module.exports = {
    encodeDashboardId,
    parseDashboardId,
};