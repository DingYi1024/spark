import type { AppCopy, ModeMeta, TaskDatabase } from '../types';
import { setAppCopy } from './copy';
import { setModeConfig } from './modes';
import { setTaskDatabase } from './tasks';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function loadRuntimeData(): Promise<void> {
  const [database, modes, copy] = await Promise.all([
    fetchJson<TaskDatabase>('/static/database.json'),
    fetchJson<Array<Omit<ModeMeta, 'icon'> & { icon: string }>>('/static/modes.json'),
    fetchJson<AppCopy>('/static/app-copy.json'),
  ]);

  if (database) setTaskDatabase(database);
  if (modes) setModeConfig(modes);
  if (copy) setAppCopy(copy);
}
