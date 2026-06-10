/**
 * @param {import('mongoose').ClientSession | null | undefined} session
 * @returns {{ session?: import('mongoose').ClientSession }}
 */
function sessionOptions(session) {
    return session ? { session } : {};
}

module.exports = { sessionOptions };