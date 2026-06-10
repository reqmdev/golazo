const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const { MODAL_IDS } = require('../constants');

/**
 * @param {string} prefix
 * @param {string} slug
 */
function modalIdWithSlug(prefix, slug) {
    return `${prefix}:${slug}`;
}

/**
 * @param {string} customId
 * @param {string} prefix
 */
function parseModalSlug(customId, prefix) {
    if (!customId.startsWith(`${prefix}:`)) {
        return null;
    }

    return customId.slice(prefix.length + 1);
}

/**
 * @param {(key: string, params?: Record<string, string | number>) => string} tr
 */
function buildCreateLeagueModal(tr) {
    return new ModalBuilder()
        .setCustomId(MODAL_IDS.CREATE_LEAGUE)
        .setTitle(tr('dashboard.modal.createTitle').slice(0, 45))
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('name')
                    .setLabel(tr('dashboard.modal.createName'))
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(64)
                    .setRequired(true),
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('slug')
                    .setLabel(tr('dashboard.modal.createSlug'))
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(0)
                    .setMaxLength(50)
                    .setRequired(false),
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('format')
                    .setLabel(tr('dashboard.modal.createFormat'))
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('single_round_robin')
                    .setRequired(false),
            ),
        );
}

/**
 * @param {(key: string) => string} tr
 * @param {string} slug
 */
function buildAddTeamModal(tr, slug) {
    return new ModalBuilder()
        .setCustomId(modalIdWithSlug(MODAL_IDS.ADD_TEAM, slug))
        .setTitle(tr('dashboard.modal.addTeamTitle').slice(0, 45))
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('name')
                    .setLabel(tr('dashboard.modal.teamName'))
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(64)
                    .setRequired(true),
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('short_name')
                    .setLabel(tr('dashboard.modal.teamShort'))
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(8)
                    .setRequired(false),
            ),
        );
}

/**
 * @param {(key: string) => string} tr
 * @param {string} slug
 */
function buildRemoveTeamModal(tr, slug) {
    return new ModalBuilder()
        .setCustomId(modalIdWithSlug(MODAL_IDS.REMOVE_TEAM, slug))
        .setTitle(tr('dashboard.modal.removeTeamTitle').slice(0, 45))
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('name')
                    .setLabel(tr('dashboard.modal.teamName'))
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(64)
                    .setRequired(true),
            ),
        );
}

/**
 * @param {(key: string) => string} tr
 * @param {string} slug
 */
function buildEditPointsModal(tr, slug) {
    return new ModalBuilder()
        .setCustomId(modalIdWithSlug(MODAL_IDS.EDIT_POINTS, slug))
        .setTitle(tr('dashboard.modal.pointsTitle').slice(0, 45))
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('win')
                    .setLabel(tr('dashboard.modal.pointsWin'))
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setPlaceholder('3'),
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('draw')
                    .setLabel(tr('dashboard.modal.pointsDraw'))
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setPlaceholder('1'),
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('loss')
                    .setLabel(tr('dashboard.modal.pointsLoss'))
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setPlaceholder('0'),
            ),
        );
}

/**
 * @param {(key: string, params?: object) => string} tr
 * @param {string} matchId
 * @param {string} homeName
 * @param {string} awayName
 */
function buildForfeitModal(tr, matchId, homeName, awayName) {
    return new ModalBuilder()
        .setCustomId(`${MODAL_IDS.FORFEIT}:${matchId}`)
        .setTitle(tr('dashboard.modal.forfeitTitle').slice(0, 45))
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('winner')
                    .setLabel(tr('dashboard.modal.forfeitWinner'))
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`${homeName} / ${awayName}`)
                    .setRequired(true),
            ),
        );
}

module.exports = {
    modalIdWithSlug,
    parseModalSlug,
    buildCreateLeagueModal,
    buildAddTeamModal,
    buildRemoveTeamModal,
    buildEditPointsModal,
    buildForfeitModal,
};