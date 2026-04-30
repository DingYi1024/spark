import { describe, expect, it } from 'vitest';
import { advancePosition, createBoardCells, END_POSITION, getSpecialAction, getTaskOutcome, nextPlayer, rollDice } from '../../modern/src/game/engine';
import { parseDurationSeconds } from '../../modern/src/game/timer-parser';
import type { TaskBank } from '../../modern/src/types';

describe('game engine', () => {
  it('creates the same 0-61 board model as the legacy package', () => {
    const cells = createBoardCells();

    expect(cells).toHaveLength(62);
    expect(cells[0]).toMatchObject({ label: '起点', type: 'start' });
    expect(cells[61]).toMatchObject({ label: '终点', type: 'end' });
  });

  it('keeps dice rolls in the expected range', () => {
    expect(rollDice(() => 0)).toBe(1);
    expect(rollDice(() => 0.999)).toBe(6);
  });

  it('clamps movement at the end position', () => {
    expect(advancePosition(60, 6)).toBe(END_POSITION);
  });

  it('switches players in the same order as legacy', () => {
    expect(nextPlayer('boy')).toBe('girl');
    expect(nextPlayer('girl')).toBe('boy');
  });

  it('parses legacy movement task text', () => {
    expect(getSpecialAction('【命运倒流】回到起点')).toEqual({ type: 'move', target: 0 });
    expect(getSpecialAction('回到15')).toEqual({ type: 'move', target: 15 });
    expect(getSpecialAction('直达终点')).toEqual({ type: 'move', target: END_POSITION });
  });

  it('uses structured movement actions before reading task text', () => {
    const bank: TaskBank = {
      '1': {
        m: '正常互动任务',
        f: '直达终点只是文案',
        action: { type: 'move', target: 12 },
      },
    };

    expect(getTaskOutcome(bank, 1, 'boy')).toEqual({
      text: '正常互动任务',
      action: { type: 'move', target: 12 },
    });
    expect(getTaskOutcome(bank, 1, 'girl')).toEqual({
      text: '直达终点只是文案',
      action: { type: 'move', target: 12 },
    });
  });

  it('does not trigger modern movement from task wording alone', () => {
    const bank: TaskBank = {
      '1': {
        m: '文案里提到直达终点，但没有配置动作',
        f: '文案里提到回到15，但没有配置动作',
      },
      '2': '直达终点',
    };

    expect(getTaskOutcome(bank, 1, 'boy')).toEqual({
      text: '文案里提到直达终点，但没有配置动作',
      action: null,
    });
    expect(getTaskOutcome(bank, 1, 'girl')).toEqual({
      text: '文案里提到回到15，但没有配置动作',
      action: null,
    });
    expect(getTaskOutcome(bank, 2, 'boy')).toEqual({
      text: '直达终点',
      action: { type: 'move', target: END_POSITION },
    });
  });

  it('parses task durations for the floating timer', () => {
    expect(parseDurationSeconds('摆一个姿势 30秒')).toBe(30);
    expect(parseDurationSeconds('亲吻一分钟')).toBe(60);
    expect(parseDurationSeconds('休息半分钟')).toBe(30);
    expect(parseDurationSeconds('按摩两分钟')).toBe(120);
  });
});
