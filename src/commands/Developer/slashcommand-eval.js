const { ChatInputCommandInteraction, ApplicationCommandOptionType, AttachmentBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const { createTranslator, resolveLocaleFromInteraction } = require("../../i18n");
const { deliver } = require("../../ui/ReplyService");
const { redactSecrets } = require("../../utils/redactSecrets");
const { buildInfoCardV2Payload, finalizeV2Payload } = require("../../ui/ComponentsV2Factory");

module.exports = new ApplicationCommand({
    command: {
        name: 'eval',
        description: 'Execute JavaScript (owner only, Golazo debug).',
        type: 1,
        dm_permission: false,
        default_member_permissions: '0',
        options: [{
            name: 'code',
            description: 'The code to execute.',
            type: ApplicationCommandOptionType.String,
            required: true
        }]
    },
    options: {
        botOwner: true
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const { locale } = await resolveLocaleFromInteraction(interaction, client);
        const tr = createTranslator(locale);

        await interaction.deferReply();

        const code = interaction.options.getString('code', true);

        try {
            let result = eval(`(async () => { ${code} })()`);

            if (result instanceof Promise) result = await result;

            if (typeof result !== 'string') result = require('util').inspect(result);

            result = redactSecrets(`${result}`.replace(new RegExp(client.token, 'gi'), 'CLIENT_TOKEN'));

            await deliver(interaction, finalizeV2Payload(buildInfoCardV2Payload({
                tr,
                variant: 'utility',
                descriptionKey: 'commands.eval.ok',
                extraFiles: [
                    new AttachmentBuilder(Buffer.from(`${result}`, 'utf-8'), { name: 'output.ts' })
                ],
            })));
        } catch (err) {
            await deliver(interaction, finalizeV2Payload(buildInfoCardV2Payload({
                tr,
                tone: 'danger',
                descriptionKey: 'common.somethingWentWrong',
                extraFiles: [
                    new AttachmentBuilder(Buffer.from(`${err}`, 'utf-8'), { name: 'output.ts' })
                ],
            })));
        };
    }
}).toJSON();