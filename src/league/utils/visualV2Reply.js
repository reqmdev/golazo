const { buildLeagueCardV2Payload } = require('../../ui/ComponentsV2Factory');
const { buildV2MetaBlock, metaLine } = require('./v2Meta');

/**
 * @param {import('discord.js').InteractionReplyOptions & { empty?: boolean, round?: number }} payload
 */
function stripLeagueReplyMeta(payload) {
    const { empty, round, ...reply } = payload;
    return reply;
}

/**
 * @param {object} input
 * @param {(key: string, params?: object) => string} input.tr
 * @param {string} [input.titleKey]
 * @param {Record<string, string | number>} [input.titleParams]
 * @param {string} input.slug
 * @param {number} [input.page]
 * @param {number} [input.totalPages]
 * @param {string} [input.subtitleKey]
 * @param {string} [input.footerKey]
 * @param {string} [input.fallbackContent]
 * @param {{ buffer: Buffer, filename: string } | null} [input.renderResult]
 * @param {import('discord.js').ActionRowBuilder[]} [input.actionRows]
 */
function buildFixtureV2Reply(input) {
    const {
        tr,
        titleKey = 'handlers.fixture.show.title',
        titleParams,
        slug,
        page,
        totalPages,
        subtitleKey = 'handlers.fixture.v2Subtitle',
        footerKey = 'handlers.fixture.v2Footer',
        fallbackContent,
        renderResult,
        actionRows = [],
    } = input;
    const hasImage = Boolean(renderResult?.buffer && renderResult?.filename);

    return buildLeagueCardV2Payload({
        tr,
        headingKey: titleKey,
        headingParams: titleParams,
        meta: hasImage
            ? buildV2MetaBlock(tr, {
                viewEmojiKey: 'fixture',
                viewTitleKey: 'common.v2ViewFixture',
                name: titleParams?.name ?? slug,
                slug,
                round: titleParams?.round ?? 1,
                totalRounds: titleParams?.totalRounds ?? 1,
                page,
                totalPages,
            })
            : undefined,
        subtitleKey: hasImage ? undefined : subtitleKey,
        image: hasImage ? renderResult : undefined,
        body: hasImage ? undefined : fallbackContent,
        footerKey: hasImage ? undefined : footerKey,
        actionRows,
    });
}

/**
 * @param {object} input
 * @param {(key: string, params?: object) => string} input.tr
 * @param {string} input.titleKey
 * @param {Record<string, string | number>} [input.titleParams]
 * @param {string} input.slug
 * @param {number} [input.page]
 * @param {number} [input.totalPages]
 * @param {string} [input.fallbackContent]
 * @param {{ buffer: Buffer, filename: string } | null} [input.renderResult]
 * @param {import('discord.js').ActionRowBuilder[]} [input.actionRows]
 */
function buildStandingsV2Reply(input) {
    const {
        tr,
        titleKey,
        titleParams,
        slug,
        page,
        totalPages,
        fallbackContent,
        renderResult,
        actionRows = [],
    } = input;
    const hasImage = Boolean(renderResult?.buffer && renderResult?.filename);

    return buildLeagueCardV2Payload({
        tr,
        headingKey: titleKey,
        headingParams: titleParams,
        meta: hasImage
            ? buildV2MetaBlock(tr, {
                viewEmojiKey: 'standings',
                viewTitleKey: 'common.v2ViewStandings',
                name: titleParams?.name ?? slug,
                slug,
                page,
                totalPages,
            })
            : undefined,
        subtitleKey: hasImage ? undefined : 'handlers.standings.v2Subtitle',
        image: hasImage ? renderResult : undefined,
        body: hasImage ? undefined : fallbackContent,
        footerKey: hasImage ? undefined : 'handlers.standings.v2Footer',
        actionRows,
    });
}

/**
 * @param {object} input
 */
function buildTeamListV2Reply(input) {
    const {
        tr,
        titleParams,
        slug,
        page,
        totalPages,
        teamCount,
        fallbackContent,
        renderResult,
        actionRows = [],
    } = input;
    const hasImage = Boolean(renderResult?.buffer && renderResult?.filename);

    return buildLeagueCardV2Payload({
        tr,
        headingKey: 'handlers.team.list.title',
        headingParams: titleParams,
        meta: hasImage
            ? buildV2MetaBlock(tr, {
                viewEmojiKey: 'team',
                viewTitleKey: 'common.v2ViewTeams',
                name: titleParams?.name ?? slug,
                slug,
                page,
                totalPages,
                extraLines: [
                    metaLine(tr, 'team', 'common.v2LabelTeams', `**${teamCount}**`, { plain: true }),
                ],
            })
            : undefined,
        image: hasImage ? renderResult : undefined,
        body: hasImage ? undefined : fallbackContent,
        actionRows,
    });
}

/**
 * @param {object} input
 */
function buildMatchResultV2Reply(input) {
    const {
        tr,
        slug,
        leagueName,
        round,
        totalRounds,
        titleKey,
        titleParams,
        postImageHint,
        renderResult,
    } = input;
    const hasImage = Boolean(renderResult?.buffer && renderResult?.filename);

    return buildLeagueCardV2Payload({
        tr,
        headingKey: titleKey,
        headingParams,
        meta: hasImage
            ? buildV2MetaBlock(tr, {
                viewEmojiKey: 'score',
                viewTitleKey: 'common.v2ViewMatchResult',
                name: leagueName,
                slug,
                round,
                totalRounds,
            })
            : undefined,
        postImageHint: hasImage ? postImageHint : undefined,
        image: hasImage ? renderResult : undefined,
        body: hasImage ? undefined : postImageHint,
        actionRows: [],
    });
}

/**
 * @param {object} input
 */
function buildRollbackV2Reply(input) {
    const {
        tr,
        slug,
        titleParams,
        statsText,
        renderResult,
    } = input;
    const hasImage = Boolean(renderResult?.buffer && renderResult?.filename);

    return buildLeagueCardV2Payload({
        tr,
        headingKey: 'handlers.rollback.success',
        headingParams: titleParams,
        meta: hasImage
            ? buildV2MetaBlock(tr, {
                viewEmojiKey: 'standings',
                viewTitleKey: 'common.v2ViewRollback',
                name: titleParams?.name ?? slug,
                slug,
                extraLines: statsText ? [statsText] : [],
            })
            : undefined,
        postImageHint: hasImage ? statsText : undefined,
        image: hasImage ? renderResult : undefined,
        body: hasImage ? undefined : statsText,
        actionRows: [],
    });
}

/**
 * @param {object} input
 */
function buildScoreEntryV2Reply(input) {
    const {
        tr,
        titleKey = 'handlers.scoreEntry.title',
        titleParams,
        slug,
        page,
        totalPages,
        fallbackContent,
        renderResult,
        actionRows = [],
        canReport = true,
    } = input;
    const hasImage = Boolean(renderResult?.buffer && renderResult?.filename);
    const hint = canReport
        ? tr('handlers.scoreEntry.hint')
        : tr('handlers.scoreEntry.noPermission');

    return buildLeagueCardV2Payload({
        tr,
        headingKey: titleKey,
        headingParams: titleParams,
        meta: hasImage
            ? buildV2MetaBlock(tr, {
                viewEmojiKey: 'score',
                viewTitleKey: 'common.v2ViewScore',
                name: titleParams?.name ?? slug,
                slug,
                round: titleParams?.round ?? 1,
                totalRounds: titleParams?.totalRounds ?? 1,
                page,
                totalPages,
            })
            : undefined,
        subtitle: hasImage ? undefined : hint,
        postImageHint: hasImage ? hint : undefined,
        image: hasImage ? renderResult : undefined,
        body: hasImage ? undefined : fallbackContent,
        footerKey: hasImage ? undefined : 'handlers.scoreEntry.v2Footer',
        actionRows,
    });
}

module.exports = {
    stripLeagueReplyMeta,
    buildFixtureV2Reply,
    buildStandingsV2Reply,
    buildTeamListV2Reply,
    buildMatchResultV2Reply,
    buildRollbackV2Reply,
    buildScoreEntryV2Reply,
};