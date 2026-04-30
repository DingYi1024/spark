import database from '../../../static/database.json';
import type { ModeId, TaskBank, TaskDatabase, TaskEntry, Player, SpecialAction } from '../types';

export let taskDatabase = database as TaskDatabase;
const FIRST_ACTION_TARGET = 0;
const LAST_ACTION_TARGET = 61;

export function setTaskDatabase(databaseConfig: TaskDatabase): void {
  taskDatabase = databaseConfig;
}

export function getTaskBank(mode: ModeId): TaskBank {
  return taskDatabase[mode] ?? {};
}

export function resolveTask(entry: TaskEntry | undefined, player: Player): string {
  if (!entry) return '神秘格子，两人喝交杯酒';
  if (typeof entry === 'string') return entry;
  return player === 'boy' ? entry.m : entry.f;
}

export function resolveTaskAction(entry: TaskEntry | undefined): SpecialAction | null {
  if (!entry || typeof entry === 'string' || !entry.action) return null;
  if (entry.action.type !== 'move') return null;
  if (!Number.isInteger(entry.action.target)) return null;
  if (entry.action.target < FIRST_ACTION_TARGET || entry.action.target > LAST_ACTION_TARGET) return null;
  return entry.action;
}
