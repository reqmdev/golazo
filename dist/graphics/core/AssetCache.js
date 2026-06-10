"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCanvasAssetsRoot = getCanvasAssetsRoot;
exports.getAssetBuffer = getAssetBuffer;
exports.getLogoBuffer = getLogoBuffer;
exports.loadTeamLogos = loadTeamLogos;
exports.clearAssetCache = clearAssetCache;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cache = new Map();
const inflight = new Map();
function projectRoot() {
    return path.join(__dirname, '..', '..', '..');
}
function getCanvasAssetsRoot() {
    return path.join(projectRoot(), 'src', 'assets', 'canvas');
}
async function getAssetBuffer(relativePath) {
    const fullPath = path.join(getCanvasAssetsRoot(), relativePath);
    if (!fs.existsSync(fullPath))
        return null;
    return fs.readFileSync(fullPath);
}
async function getLogoBuffer(url, fetcher, ttlMs = 15 * 60 * 1000) {
    if (!url || typeof url !== 'string')
        return null;
    const now = Date.now();
    const cached = cache.get(url);
    if (cached && cached.expiresAt > now)
        return cached.buffer;
    if (inflight.has(url))
        return inflight.get(url);
    const promise = (async () => {
        try {
            const buffer = await fetcher(url);
            if (buffer) {
                cache.set(url, { buffer, expiresAt: now + ttlMs });
            }
            return buffer;
        }
        catch {
            return null;
        }
        finally {
            inflight.delete(url);
        }
    })();
    inflight.set(url, promise);
    return promise;
}
async function loadTeamLogos(teams, fetcher) {
    const logos = new Map();
    const unique = new Map();
    for (const team of teams) {
        if (!team?.id || unique.has(team.id))
            continue;
        unique.set(team.id, team.logoUrl || null);
    }
    await Promise.all([...unique.entries()].map(async ([id, url]) => {
        logos.set(id, url ? await getLogoBuffer(url, fetcher) : null);
    }));
    return logos;
}
function clearAssetCache() {
    cache.clear();
    inflight.clear();
}
//# sourceMappingURL=AssetCache.js.map