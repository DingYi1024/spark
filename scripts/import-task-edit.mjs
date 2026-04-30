import fs from 'node:fs';
import path from 'node:path';
import { formatTaskAction, readModeConfigs, repoPath } from './task-bank.mjs';

const sourceArg = process.argv[2];
const sourcePath = sourceArg ? path.resolve(sourceArg) : repoPath('docs', 'TASK_BANK_EDIT.md');
const modes = readModeConfigs();
const modeById = new Map(modes.map((mode) => [mode.id, mode]));

function splitMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return [];

  return trimmed
    .slice(1, -1)
    .replace(/\\\|/g, '\uE000')
    .split('|')
    .map((cell) =>
      cell
        .replace(/\uE000/g, '|')
        .replace(/<br\s*\/?>/gi, '\n')
        .trim(),
    );
}

function escapeMarkdownCell(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, '<br>')
    .replace(/\|/g, '\\|')
    .trim();
}

function parseModeId(headerLine) {
  const match = headerLine.match(/（([a-z][a-z0-9_-]*)）/);
  return match?.[1] ?? null;
}

function parseTaskRow(line) {
  if (!/^\|\s*\d+\s*\|/.test(line)) return null;

  const cells = splitMarkdownRow(line);
  const position = Number(cells[0]);
  if (!Number.isInteger(position)) return null;

  if (cells.length >= 5) {
    return { position, m: cells[2] ?? '', f: cells[3] ?? '', action: cells[4] ?? '' };
  }

  if (cells.length >= 4) {
    const maybeSource = cells[1] ?? '';
    if (/^(?:双轨|单条待拆分|来源|source)$/i.test(maybeSource)) {
      return { position, m: cells[2] ?? '', f: cells[3] ?? '', action: '' };
    }
    return { position, m: cells[1] ?? '', f: cells[2] ?? '', action: cells[3] ?? '' };
  }

  if (cells.length >= 3) {
    return { position, m: cells[1] ?? '', f: cells[2] ?? '', action: '' };
  }

  return null;
}

if (!fs.existsSync(sourcePath)) {
  console.error(`Task edit file not found: ${sourcePath}`);
  process.exit(1);
}

const markdown = fs.readFileSync(sourcePath, 'utf8');
const imported = new Map();
let currentModeId = null;

for (const line of markdown.split(/\r?\n/)) {
  if (line.startsWith('## ')) {
    currentModeId = parseModeId(line);
    if (currentModeId && modeById.has(currentModeId) && !imported.has(currentModeId)) {
      imported.set(currentModeId, new Map());
    }
    continue;
  }

  if (!currentModeId || !imported.has(currentModeId)) continue;

  const row = parseTaskRow(line);
  if (row) {
    imported.get(currentModeId).set(row.position, row);
  }
}

const missingModes = modes.filter((mode) => !imported.has(mode.id));
if (missingModes.length > 0) {
  console.error(`Task edit file is missing mode section(s): ${missingModes.map((mode) => mode.id).join(', ')}`);
  process.exit(1);
}

const outDir = repoPath('content', 'tasks');
fs.mkdirSync(outDir, { recursive: true });

for (const mode of modes) {
  const rows = imported.get(mode.id);
  const missingPositions = [];

  for (let position = 1; position <= 61; position += 1) {
    if (!rows.has(position)) missingPositions.push(position);
  }

  if (missingPositions.length > 0) {
    console.error(`${mode.id} is missing position(s): ${missingPositions.join(', ')}`);
    process.exit(1);
  }

  const lines = [];
  lines.push(`# ${mode.name}（${mode.id}）`);
  lines.push('');
  lines.push('> 维护说明：男生回合读取 `m` 列，女生回合读取 `f` 列；需要跳格时填写 `动作 action` 列。请保持 1-61 格完整。');
  lines.push('');
  lines.push('| 格子 | 男生回合任务 m | 女生回合任务 f | 动作 action |');
  lines.push('|---:|---|---|---|');

  for (let position = 1; position <= 61; position += 1) {
    const row = rows.get(position);
    lines.push(`| ${position} | ${escapeMarkdownCell(row.m)} | ${escapeMarkdownCell(row.f)} | ${formatTaskAction(row.action)} |`);
  }

  fs.writeFileSync(path.join(outDir, `${mode.taskBank}.md`), `${lines.join('\n')}\n`, 'utf8');
}

console.log(`Imported task edit file into ${outDir}`);
