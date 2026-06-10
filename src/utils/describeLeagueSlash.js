/**
 * Summarize registered /league slash structure for reload diagnostics.
 *
 * @param {import('../structure/ApplicationCommand') | { command?: { options?: object[] } }} leagueCommand
 */
function describeLeagueSlash(leagueCommand) {
    const options = leagueCommand?.command?.options || [];
    const fixtureGroup = options.find((entry) => entry.name === 'fixture');
    const showSub = fixtureGroup?.options?.find((entry) => entry.name === 'show');
    const hasFixturePage = Boolean(showSub?.options?.some((entry) => entry.name === 'page'));

    return {
        topLevelCount: options.length,
        hasFixturePage,
        groups: options.filter((entry) => entry.type === 2).map((entry) => entry.name)
    };
}

module.exports = { describeLeagueSlash };