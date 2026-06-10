import * as path from 'path';
import { resolveTheme } from '../utils/theme';
import { renderMatchResultCard } from '../cards/MatchResultCard';
import { renderStandingsCard } from '../cards/StandingsCard';
import { renderFixtureCard } from '../cards/FixtureCard';
import { renderTeamsCard } from '../cards/TeamsCard';
import { renderHelpFooterCard, renderBrandMarkCard } from '../cards/HelpFooterCard';
import type { RenderResult, Theme } from '../core/types';

type RendererType = 'match_result' | 'standings' | 'fixture' | 'team_list';

interface RendererOptions {
  themeId?: string;
  accentColor?: string;
}

function getLogoFetcher(): (url: string) => Promise<Buffer | null> {
  const fetchModule = path.join(process.cwd(), 'src', 'league', 'utils', 'validateLogoUrl.js');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { fetchLogoBuffer } = require(fetchModule);
  return fetchLogoBuffer;
}

abstract class SvgRendererBase {
  protected theme: Theme;

  constructor(options: RendererOptions = {}) {
    this.theme = resolveTheme(options.themeId, { primary: options.accentColor });
  }

  abstract render(view: unknown): Promise<RenderResult>;
}

class SvgMatchResultRenderer extends SvgRendererBase {
  async render(view: Parameters<typeof renderMatchResultCard>[0]): Promise<RenderResult> {
    return renderMatchResultCard(view, this.theme, getLogoFetcher());
  }
}

class SvgStandingsRenderer extends SvgRendererBase {
  async render(view: Parameters<typeof renderStandingsCard>[0]): Promise<RenderResult> {
    return renderStandingsCard(view, this.theme, getLogoFetcher());
  }
}

class SvgFixtureRenderer extends SvgRendererBase {
  async render(view: Parameters<typeof renderFixtureCard>[0]): Promise<RenderResult> {
    return renderFixtureCard(view, this.theme, getLogoFetcher());
  }
}

class SvgTeamsRenderer extends SvgRendererBase {
  async render(view: Parameters<typeof renderTeamsCard>[0]): Promise<RenderResult> {
    return renderTeamsCard(view, this.theme, getLogoFetcher());
  }
}

const SVG_RENDERERS: Record<RendererType, new (options?: RendererOptions) => SvgRendererBase> = {
  match_result: SvgMatchResultRenderer,
  standings: SvgStandingsRenderer,
  fixture: SvgFixtureRenderer,
  team_list: SvgTeamsRenderer,
};

export function createSvgRenderer(type: string, options: RendererOptions = {}): SvgRendererBase {
  const Renderer = SVG_RENDERERS[type as RendererType];
  if (!Renderer) {
    throw new Error(`Unknown SVG renderer type: ${type}`);
  }
  return new Renderer(options);
}

export function shouldUseSvgEngine(type: string, config: { engine?: string; svgCards?: string[] }): boolean {
  if (config.engine === 'svg') return true;
  if (config.svgCards?.includes(type)) return true;
  return false;
}

export async function renderHelpFooterSvg(input: {
  pageId: string;
  heroTitle: string;
  heroSubtitle: string;
  brandLabel: string;
  accent: string;
}): Promise<Buffer> {
  const theme = resolveTheme('sports_dark');
  return renderHelpFooterCard(input, theme);
}

export async function renderBrandMarkSvg(): Promise<Buffer> {
  return renderBrandMarkCard(resolveTheme('sports_dark'));
}

export { resolveTheme };