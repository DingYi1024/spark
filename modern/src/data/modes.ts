import modeConfig from '../../../static/modes.json';
import type { ModeId, ModeMeta } from '../types';

const icon = (name: string) => new URL(`../../../static/${name}.svg`, import.meta.url).href;
const fallbackIcon = icon('qinglu');

function withIcon(mode: Omit<ModeMeta, 'icon'> & { icon: string }): ModeMeta {
  let iconUrl = fallbackIcon;
  try {
    iconUrl = icon(mode.icon);
  } catch {
    iconUrl = fallbackIcon;
  }

  return {
    ...mode,
    icon: iconUrl,
  };
}

function normalizeModes(config: Array<Omit<ModeMeta, 'icon'> & { icon: string }>): ModeMeta[] {
  return config
    .slice()
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map(withIcon);
}

export let allModes: ModeMeta[] = normalizeModes(modeConfig as Array<Omit<ModeMeta, 'icon'> & { icon: string }>);

export let modes: ModeMeta[] = allModes.filter((mode) => mode.visible);

export let modeOrder: ModeId[] = modes.map((mode) => mode.id);

export let defaultMode = modes[0] ?? allModes[0];

export function setModeConfig(config: Array<Omit<ModeMeta, 'icon'> & { icon: string }>): void {
  allModes = normalizeModes(config);
  modes = allModes.filter((mode) => mode.visible);
  modeOrder = modes.map((mode) => mode.id);
  defaultMode = modes[0] ?? allModes[0];
}

export function getModeMeta(modeId: ModeId): ModeMeta {
  return allModes.find((mode) => mode.id === modeId) ?? defaultMode;
}

export function isKnownMode(modeId: string): boolean {
  return allModes.some((mode) => mode.id === modeId);
}
