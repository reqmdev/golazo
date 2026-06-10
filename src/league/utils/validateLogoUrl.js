const LeagueError = require('../errors/LeagueError');

const MAX_LOGO_URL_LENGTH = 512;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 3_000;
const MAX_REDIRECTS = 3;

/**
 * @param {string} hostname
 */
function isBlockedHostname(hostname) {
    const host = hostname.toLowerCase();

    if (host === 'localhost' || host.endsWith('.localhost')) {
        return true;
    }

    if (host === '0.0.0.0') {
        return true;
    }

    // IPv4 private/link-local ranges
    if (/^127\./.test(host)) return true;
    if (/^10\./.test(host)) return true;
    if (/^192\.168\./.test(host)) return true;
    if (/^169\.254\./.test(host)) return true;

    const match172 = host.match(/^172\.(\d+)\./);

    if (match172) {
        const second = Number(match172[1]);
        if (second >= 16 && second <= 31) return true;
    }

    // IPv6 loopback / link-local
    if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) {
        return true;
    }

    return false;
}

/**
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
function normalizeLogoUrl(url) {
    if (!url) {
        return null;
    }

    const trimmed = url.trim();

    if (!trimmed) {
        return null;
    }

    return trimmed;
}

/**
 * @param {string | null | undefined} url
 */
function assertValidLogoUrl(url) {
    const normalized = normalizeLogoUrl(url);

    if (!normalized) {
        return null;
    }

    if (normalized.length > MAX_LOGO_URL_LENGTH) {
        throw new LeagueError('INVALID_LOGO_URL_LENGTH', { max: MAX_LOGO_URL_LENGTH });
    }

    let parsed;

    try {
        parsed = new URL(normalized);
    } catch {
        throw new LeagueError('INVALID_LOGO_URL_FORMAT');
    }

    if (parsed.protocol !== 'https:') {
        throw new LeagueError('INVALID_LOGO_URL_HTTPS');
    }

    if (!parsed.hostname) {
        throw new LeagueError('INVALID_LOGO_URL_HOSTNAME');
    }

    if (isBlockedHostname(parsed.hostname)) {
        throw new LeagueError('INVALID_LOGO_URL_PRIVATE');
    }

    return normalized;
}

/**
 * @param {string} url
 * @returns {Promise<Response | null>}
 */
async function fetchLogoResponse(url) {
    let current = assertValidLogoUrl(url);

    if (!current) {
        return null;
    }

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        const response = await fetch(current, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            redirect: 'manual',
            headers: { 'User-Agent': 'GolazoBot/1.0' }
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');

            if (!location || hop === MAX_REDIRECTS) {
                return null;
            }

            current = new URL(location, current).href;
            assertValidLogoUrl(current);
            continue;
        }

        return response;
    }

    return null;
}

/**
 * Fetch image bytes safely before canvas decode.
 *
 * @param {string} url
 */
async function fetchLogoBuffer(url) {
    const response = await fetchLogoResponse(url);

    if (!response || !response.ok) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.startsWith('image/')) {
        return null;
    }

    const contentLength = Number(response.headers.get('content-length') || 0);

    if (contentLength > MAX_LOGO_BYTES) {
        return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length > MAX_LOGO_BYTES) {
        return null;
    }

    return buffer;
}

module.exports = {
    MAX_LOGO_BYTES,
    FETCH_TIMEOUT_MS,
    MAX_REDIRECTS,
    assertValidLogoUrl,
    normalizeLogoUrl,
    fetchLogoBuffer,
    fetchLogoResponse,
    isBlockedHostname
};