/**
 * Join embed body lines; drops empty entries.
 * @param {...(string | null | undefined | false)} lines
 */
function body(...lines) {
    return lines.filter((line) => line != null && line !== '').join('\n');
}

module.exports = { body };