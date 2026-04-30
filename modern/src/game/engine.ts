import type { BoardCell, Player, SpecialAction, TaskBank } from '../types';
import { resolveTask, resolveTaskAction } from '../data/tasks';

export const START_POSITION = 0;
export const END_POSITION = 61;
export const DICE_MIN = 1;
export const DICE_MAX = 6;

export function createBoardCells(endPosition = END_POSITION): BoardCell[] {
  const cells: BoardCell[] = [];

  for (let position = START_POSITION; position <= endPosition; position += 1) {
    cells.push({
      position,
      label: getCellLabel(position, endPosition),
      type: getCellType(position, endPosition),
    });
  }

  return cells;
}

export function getCellLabel(position: number, endPosition = END_POSITION): string {
  if (position === START_POSITION) return '起点';
  if (position === endPosition) return '终点';
  return String(position);
}

export function getCellType(position: number, endPosition = END_POSITION): BoardCell['type'] {
  if (position === START_POSITION) return 'start';
  if (position === endPosition) return 'end';
  if (position % DICE_MAX === 0) return 'special';
  return 'normal';
}

export function clampPosition(position: number, endPosition = END_POSITION): number {
  return Math.max(START_POSITION, Math.min(endPosition, position));
}

export function advancePosition(position: number, diceValue: number, endPosition = END_POSITION): number {
  return clampPosition(position + diceValue, endPosition);
}

export function nextPlayer(player: Player): Player {
  return player === 'boy' ? 'girl' : 'boy';
}

export function playerLabel(player: Player): string {
  return player === 'boy' ? '男生' : '女生';
}

export function rollDice(random = Math.random): number {
  return Math.floor(random() * DICE_MAX) + DICE_MIN;
}

export function getTaskForPosition(bank: TaskBank, position: number, player: Player): string {
  return resolveTask(bank[String(position)], player);
}

export function getTaskOutcome(bank: TaskBank, position: number, player: Player): { text: string; action: SpecialAction | null } {
  const entry = bank[String(position)];
  const text = resolveTask(entry, player);
  return {
    text,
    action: resolveTaskAction(entry) ?? (typeof entry === 'string' ? getSpecialAction(text) : null),
  };
}

export function getSpecialAction(taskText: string): SpecialAction | null {
  if (taskText.includes('回到起点') || taskText.includes('命运倒流')) {
    return { type: 'move', target: START_POSITION };
  }

  if (taskText.includes('直达终点')) {
    return { type: 'move', target: END_POSITION };
  }

  const explicitMove = taskText.match(/(?:回到|前进到|直达)(\d+)/);
  if (explicitMove) {
    return { type: 'move', target: clampPosition(Number(explicitMove[1])) };
  }

  return null;
}
