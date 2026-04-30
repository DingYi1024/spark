import copyConfig from '../../../static/app-copy.json';
import type { AppCopy, Player } from '../types';

export let appCopy = copyConfig as AppCopy;

export function setAppCopy(copy: AppCopy): void {
  appCopy = copy;
}

export function formatCopy(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => String(values[key] ?? match));
}

export function copyPlayerLabel(player: Player): string {
  return player === 'boy' ? appCopy.boyLabel : appCopy.girlLabel;
}
