/**
 * Converts a display name into a URL-safe league slug.
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
}

module.exports = { slugify };