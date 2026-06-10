const { AttachmentBuilder } = require("discord.js");
const RenderService = require("../render/services/RenderService");
const { buildInfoCardV2Payload } = require("../../ui/ComponentsV2Factory");
const { getBrandMarkAttachment } = require("../../ui/assets");

/**
 * Build Discord reply with canvas image inside embed.
 *
 * @param {object} input
 * @param {(key: string, params?: object) => string} input.tr
 * @param {string} [input.variant]
 * @param {string} [input.titleKey]
 * @param {Record<string, string | number>} [input.titleParams]
 * @param {string} [input.titleEmojiKey]
 * @param {string} [input.description]
 * @param {string} [input.descriptionKey]
 * @param {Record<string, string | number>} [input.descriptionParams]
 * @param {import('../../ui/EmbedFactory').UiField[]} [input.fields]
 * @param {string} [input.footer]
 * @param {string} [input.footerKey]
 * @param {Record<string, string | number>} [input.footerParams]
 * @param {{ buffer: Buffer, filename: string } | null} [input.renderResult]
 * @param {string} [input.fallbackContent]
 */
function buildVisualReply(input) {
  const {
    tr,
    renderResult,
    fallbackContent,
    ...cardInput
  } = input;

  const hasImage = Boolean(renderResult?.buffer && renderResult?.filename);

  if (hasImage) {
    return {
      content: "",
      embeds: [],
      attachments: [],
      files: [
        new AttachmentBuilder(renderResult.buffer, {
          name: renderResult.filename,
        }),
      ],
      components: [],
    };
  }

  const extraFiles = [];
  const mark = getBrandMarkAttachment();

  if (mark) {
    extraFiles.push(new AttachmentBuilder(mark.buffer, { name: mark.filename }));
  }

  return buildInfoCardV2Payload({
    tr,
    variant: "full",
    description: fallbackContent || cardInput.description,
    extraFiles,
    ...cardInput,
  });
}

/**
 * Safe render wrapper — returns null on failure (text fallback).
 *
 * @param {() => Promise<{ buffer: Buffer, filename: string }>} renderFn
 */
async function tryRender(renderFn) {
  try {
    return await renderFn();
  } catch (err) {
    console.warn("[golazo] render failed:", err?.message || err);
    return null;
  }
}

module.exports = {
  buildVisualReply,
  tryRender,
  RenderService,
};