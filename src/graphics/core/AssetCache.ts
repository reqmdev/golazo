import * as fs from 'fs';
import * as path from 'path';

interface CacheEntry {
  buffer: Buffer;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<Buffer | null>>();

function projectRoot(): string {
  return path.join(__dirname, '..', '..', '..');
}

export function getCanvasAssetsRoot(): string {
  return path.join(projectRoot(), 'src', 'assets', 'canvas');
}

export async function getAssetBuffer(relativePath: string): Promise<Buffer | null> {
  const fullPath = path.join(getCanvasAssetsRoot(), relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath);
}

export async function getLogoBuffer(
  url: string | null | undefined,
  fetcher: (url: string) => Promise<Buffer | null>,
  ttlMs = 15 * 60 * 1000,
): Promise<Buffer | null> {
  if (!url || typeof url !== 'string') return null;

  const now = Date.now();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > now) return cached.buffer;

  if (inflight.has(url)) return inflight.get(url)!;

  const promise = (async () => {
    try {
      const buffer = await fetcher(url);
      if (buffer) {
        cache.set(url, { buffer, expiresAt: now + ttlMs });
      }
      return buffer;
    } catch {
      return null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, promise);
  return promise;
}

export async function loadTeamLogos(
  teams: Array<{ id: string; logoUrl?: string | null }>,
  fetcher: (url: string) => Promise<Buffer | null>,
): Promise<Map<string, Buffer | null>> {
  const logos = new Map<string, Buffer | null>();
  const unique = new Map<string, string | null>();

  for (const team of teams) {
    if (!team?.id || unique.has(team.id)) continue;
    unique.set(team.id, team.logoUrl || null);
  }

  await Promise.all(
    [...unique.entries()].map(async ([id, url]) => {
      logos.set(id, url ? await getLogoBuffer(url, fetcher) : null);
    }),
  );

  return logos;
}

export function clearAssetCache(): void {
  cache.clear();
  inflight.clear();
}