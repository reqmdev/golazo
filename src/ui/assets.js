const path = require('path');
const fs = require('fs');
const { MARK_FILENAME } = require('./tokens');
const { resolveAssetPath } = require('../canvas/loadAsset');
const { ASSET_PATHS } = require('../canvas/tokens');

const MARK_PATH = resolveAssetPath(ASSET_PATHS.brandMark);
const LEGACY_MARK_PATH = path.join(__dirname, '..', 'assets', 'help', 'generated', MARK_FILENAME);

/**
 * @returns {Buffer | null}
 */
function getBrandMarkBuffer() {
    if (fs.existsSync(MARK_PATH)) {
        return fs.readFileSync(MARK_PATH);
    }

    if (fs.existsSync(LEGACY_MARK_PATH)) {
        return fs.readFileSync(LEGACY_MARK_PATH);
    }

    return null;
}

/**
 * @returns {{ buffer: Buffer, filename: string } | null}
 */
function getBrandMarkAttachment() {
    const buffer = getBrandMarkBuffer();

    if (!buffer) {
        return null;
    }

    return { buffer, filename: MARK_FILENAME };
}

module.exports = {
    MARK_PATH,
    LEGACY_MARK_PATH,
    getBrandMarkBuffer,
    getBrandMarkAttachment
};