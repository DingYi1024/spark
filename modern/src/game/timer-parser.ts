const CN_NUMBERS: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

export function parseChineseInteger(value: string): number {
  if (/^\d+$/.test(value)) return Number(value);
  if (value === '十') return 10;
  if (value.startsWith('十')) return 10 + (CN_NUMBERS[value[1]] ?? 0);
  if (value.endsWith('十')) return (CN_NUMBERS[value[0]] ?? 0) * 10;

  const tenIndex = value.indexOf('十');
  if (tenIndex > 0) {
    const tens = CN_NUMBERS[value.slice(0, tenIndex)] ?? 0;
    const ones = CN_NUMBERS[value.slice(tenIndex + 1)] ?? 0;
    return tens * 10 + ones;
  }

  return CN_NUMBERS[value] ?? 0;
}

export function parseDurationSeconds(text: string): number | null {
  if (text.includes('半分钟')) return 30;

  const match = text.match(/([0-9一二两三四五六七八九十]+)\s*(秒|分钟|分)/);
  if (!match) return null;

  const amount = parseChineseInteger(match[1]);
  if (!amount) return null;

  return match[2] === '秒' ? amount : amount * 60;
}

