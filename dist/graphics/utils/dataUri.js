"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferToDataUri = bufferToDataUri;
function bufferToDataUri(buffer, mime = 'image/png') {
    return `data:${mime};base64,${buffer.toString('base64')}`;
}
//# sourceMappingURL=dataUri.js.map