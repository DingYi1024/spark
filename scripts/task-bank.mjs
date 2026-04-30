import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIRST_TASK_POSITION = 1;
export const LAST_TASK_POSITION = 61;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const DEFAULT_BOARD_BG = 'radial-gradient(circle at 50% 0%, #6e1f1c 0%, #241111 42%, #080706 100%)';
export const DEFAULT_ICON = 'qinglu';
export const MODE_ID_PATTERN = /^[a-z][a-z0-9_-]*$/;
export const DEFAULT_APP_COPY = {
  documentTitle: '情侣飞行棋',
  homeTitle: '情侣飞行棋',
  homeSubtitle: '今晚的回合，由骰子决定',
  homeDescriptionLabel: '玩法说明',
  homeDescription: '两人轮流掷骰前进，停在哪一格就完成对应互动。选好模式，开始今晚的专属回合。',
  startButtonPrefix: '开始',
  gameTitle: '情侣飞行棋',
  boyLabel: '男生',
  girlLabel: '女生',
  turnLabelTemplate: '{player}回合',
  boardStartLabel: '起点',
  boardEndLabel: '终点',
  diceCaption: '点击骰子开始',
  ageGateSuffix: '（仅限于18岁以上使用）',
  ageGateDescription:
    '游戏规则：按游戏玩法中的准备建议的道具，也可以自己修改奖励或惩罚。走棋规则，默认男生先行，走到对应的格子为对方做惩罚，福利自己享受，无法接受内容可自由协商做别的惩罚。',
  ageGateRulesButton: '游戏玩法',
  ageGateAgreeButton: '已知悉',
  rulesTitleSuffix: '—游戏玩法',
  rulesIntro: '起点：点击骰子即可开始游戏，默认男生先行哦！',
  rulesTaskDescription: '1-60号格子任务以当前模式题库为准，到达终点后游戏结束。',
  rulesConfirmButton: '已知悉',
  restartButton: '重新开始',
  homeButton: '返回主页',
  taskTitleSuffix: '任务',
  taskCompleteButton: '已完成',
  taskSkipButton: '协商换一个 🎲',
  timerTitle: '任务执行倒计时',
  timerDoneButton: '执行完毕',
  timerRunningButton: '执行中',
  timerStartButton: '开始执行',
  timerPauseButton: '暂停',
  timerResumeButton: '继续',
  timerResetButton: '重新执行',
  victoryTitle: '游戏结束',
  victoryMessageTemplate: '恭喜 {player} 到达终点！',
  victoryTurnsPrefix: '共投掷骰子',
  victoryTurnsSuffix: '次',
  victoryTasksPrefix: '执行了',
  victoryTasksSuffix: '个双轨任务',
  victoryGeneratingLabel: '生成中...',
  victoryGenerateButton: '📸 生成心跳回忆卡片',
  replayButton: '再来一局',
  reviewModalTitle: '长按下方卡片保存相册',
  reviewBackButton: '返回游戏',
  reviewImageAlt: '心跳回忆卡片',
  reviewCardTitle: 'LOVE FLIGHT',
  reviewCardSubtitle: '心跳回忆档案',
  reviewWinnerLabel: '本次赢家：{player}',
  reviewRollsLabel: '🎲 总计掷骰：',
  reviewRollsSuffix: '次',
  reviewTasksLabel: '🔥 触发专属：',
  reviewTasksSuffix: '个惩罚',
  reviewPrizeLabel: '🏆 终极奖励：',
  reviewPrizeText: '输的一方需要答应赢的一方任意一个条件！这属于今晚的最终大奖。',
  reviewFooter: '生成自「情侣飞行棋 Vanilla V2.0」',
};

export const FALLBACK_MODES = [
  {
    id: 'qinglu',
    name: '情侣版',
    title: '情侣版飞行棋',
    visible: true,
    order: 1,
    taskBank: 'qinglu',
    icon: 'qinglu',
    accent: '#c83a2d',
    soft: '#2b1715',
    boardBg: DEFAULT_BOARD_BG,
  },
  {
    id: 'gaoji',
    name: '高级版',
    title: '高级版飞行棋',
    visible: true,
    order: 2,
    taskBank: 'gaoji',
    icon: 'gaoji',
    accent: '#c9973d',
    soft: '#172821',
    boardBg: 'radial-gradient(circle at 50% 0%, #263d31 0%, #161b18 42%, #070806 100%)',
  },
  {
    id: 'simi',
    name: '私密版',
    title: '私密版飞行棋',
    visible: true,
    order: 3,
    taskBank: 'simi',
    icon: 'simi',
    accent: '#8e2435',
    soft: '#20111a',
    boardBg: 'radial-gradient(circle at 50% 0%, #5f1e31 0%, #1c1118 48%, #070607 100%)',
  },
  {
    id: 'sm',
    name: 'SM版',
    title: 'SM版飞行棋',
    visible: true,
    order: 4,
    taskBank: 'sm',
    icon: 'sm',
    accent: '#b21f2d',
    soft: '#171012',
    boardBg: 'radial-gradient(circle at 50% 0%, #401317 0%, #151010 46%, #050505 100%)',
  },
  {
    id: 'nvpu',
    name: '女仆版',
    title: '女仆版飞行棋',
    visible: true,
    order: 5,
    taskBank: 'nvpu',
    icon: 'nvpu',
    accent: '#b88442',
    soft: '#251812',
    boardBg: 'radial-gradient(circle at 50% 0%, #522417 0%, #211410 44%, #070605 100%)',
  },
  {
    id: 'sizu',
    name: '丝足版',
    title: '丝足版飞行棋',
    visible: true,
    order: 6,
    taskBank: 'sizu',
    icon: 'sizu',
    accent: '#4f9b7c',
    soft: '#13251f',
    boardBg: 'radial-gradient(circle at 50% 0%, #244f3f 0%, #121d19 46%, #050706 100%)',
  },
];

export function repoPath(...segments) {
  return path.join(repoRoot, ...segments);
}

export function taskSourcePath(taskBankId) {
  return repoPath('content', 'tasks', `${taskBankId}.md`);
}

export function modesSourcePath() {
  return repoPath('content', 'modes.json');
}

export function appCopySourcePath() {
  return repoPath('content', 'app-copy.json');
}

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

export function normalizeTaskAction(action) {
  if (action === undefined || action === null || action === '') return null;

  if (typeof action === 'object' && !Array.isArray(action)) {
    if (action.type !== 'move') return null;
    const target = Number(action.target);
    if (!Number.isInteger(target) || target < 0 || target > LAST_TASK_POSITION) return null;
    return { type: 'move', target };
  }

  const text = String(action).trim();
  if (!text || text === '-' || text === '无' || text.toLowerCase() === 'none') return null;
  if (/^(?:start|move:start|回到起点|命运倒流)$/i.test(text)) return { type: 'move', target: 0 };
  if (/^(?:end|move:end|直达终点)$/i.test(text)) return { type: 'move', target: LAST_TASK_POSITION };

  const match = text.match(/^(?:move\s*[:=]\s*|跳到|移动到|前进到|回到|直达)?(\d+)$/);
  if (!match) return null;

  const target = Number(match[1]);
  if (!Number.isInteger(target) || target < 0 || target > LAST_TASK_POSITION) return null;
  return { type: 'move', target };
}

export function formatTaskAction(action) {
  const normalized = normalizeTaskAction(action);
  return normalized ? `move:${normalized.target}` : '';
}

export function inferLegacyTaskAction(taskText) {
  const text = String(taskText ?? '');
  if (text.includes('回到起点') || text.includes('命运倒流')) {
    return { type: 'move', target: 0 };
  }

  if (text.includes('直达终点')) {
    return { type: 'move', target: LAST_TASK_POSITION };
  }

  const explicitMove = text.match(/(?:回到|前进到|直达)(\d+)/);
  if (!explicitMove) return null;

  const target = Number(explicitMove[1]);
  if (!Number.isInteger(target)) return null;
  return { type: 'move', target: Math.max(0, Math.min(LAST_TASK_POSITION, target)) };
}

function normalizeModeConfig(mode, index) {
  const id = String(mode.id ?? '').trim();
  if (!MODE_ID_PATTERN.test(id)) {
    throw new Error(`Invalid mode id "${id}". Use lowercase letters, numbers, "_" or "-", and start with a letter.`);
  }

  const name = String(mode.name ?? id).trim() || id;
  const title = String(mode.title ?? `${name}飞行棋`).trim() || `${name}飞行棋`;
  const taskBank = String(mode.taskBank ?? id).trim() || id;

  if (!MODE_ID_PATTERN.test(taskBank)) {
    throw new Error(`Invalid task bank id "${taskBank}" for mode "${id}".`);
  }

  return {
    id,
    name,
    title,
    visible: mode.visible !== false,
    order: Number.isFinite(Number(mode.order)) ? Number(mode.order) : index + 1,
    taskBank,
    icon: String(mode.icon ?? DEFAULT_ICON).trim() || DEFAULT_ICON,
    accent: String(mode.accent ?? '#c83a2d').trim() || '#c83a2d',
    soft: String(mode.soft ?? '#2b1715').trim() || '#2b1715',
    boardBg: String(mode.boardBg ?? DEFAULT_BOARD_BG).trim() || DEFAULT_BOARD_BG,
  };
}

export function readModeConfigs() {
  const sourcePath = modesSourcePath();
  if (!fs.existsSync(sourcePath)) {
    return FALLBACK_MODES.map(normalizeModeConfig);
  }

  const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  if (!Array.isArray(raw)) {
    throw new Error('content/modes.json must be an array.');
  }

  const seen = new Set();
  return raw.map(normalizeModeConfig).map((mode) => {
    if (seen.has(mode.id)) {
      throw new Error(`Duplicate mode id "${mode.id}" in content/modes.json.`);
    }
    seen.add(mode.id);
    return mode;
  });
}

export function writeModeConfigs(modes) {
  const normalized = modes.map(normalizeModeConfig).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  fs.mkdirSync(path.dirname(modesSourcePath()), { recursive: true });
  fs.writeFileSync(modesSourcePath(), `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
}

export function normalizeAppCopy(copy = {}) {
  const normalized = {};

  for (const [key, fallback] of Object.entries(DEFAULT_APP_COPY)) {
    const value = copy[key];
    normalized[key] = typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  return normalized;
}

export function readAppCopy() {
  const sourcePath = appCopySourcePath();
  if (!fs.existsSync(sourcePath)) {
    return normalizeAppCopy();
  }

  const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('content/app-copy.json must be a JSON object.');
  }

  return normalizeAppCopy(raw);
}

export function writeAppCopy(copy) {
  const normalized = normalizeAppCopy(copy);
  fs.mkdirSync(path.dirname(appCopySourcePath()), { recursive: true });
  fs.writeFileSync(appCopySourcePath(), `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
}

export function parseTaskMarkdown(markdown, modeId) {
  const bank = {};
  const issues = [];
  const hasActionColumn = markdown.split(/\r?\n/).some((line) => /\|\s*动作\s+action\s*\|/i.test(line));

  markdown.split(/\r?\n/).forEach((line, lineIndex) => {
    if (!/^\|\s*\d+\s*\|/.test(line)) return;

    const cells = splitMarkdownRow(line);
    const position = Number(cells[0]);
    const m = cells[1] ?? '';
    const f = cells[2] ?? '';
    const actionText = hasActionColumn ? cells[3] ?? '' : '';
    const explicitAction = normalizeTaskAction(actionText);
    const maleLegacyAction = hasActionColumn ? null : inferLegacyTaskAction(m);
    const femaleLegacyAction = hasActionColumn ? null : inferLegacyTaskAction(f);
    const inferredAction = maleLegacyAction ?? femaleLegacyAction;
    const action = explicitAction ?? inferredAction;
    const location = `${modeId}:${lineIndex + 1}`;

    if (!Number.isInteger(position)) {
      issues.push({ severity: 'error', location, message: 'Invalid task position.' });
      return;
    }

    if (position < FIRST_TASK_POSITION || position > LAST_TASK_POSITION) {
      issues.push({ severity: 'error', location, message: `Task position ${position} is outside ${FIRST_TASK_POSITION}-${LAST_TASK_POSITION}.` });
      return;
    }

    if (Object.hasOwn(bank, String(position))) {
      issues.push({ severity: 'error', location, message: `Duplicate task position ${position}.` });
      return;
    }

    if (!m) issues.push({ severity: 'error', location, message: `Position ${position} has an empty male-turn task.` });
    if (!f) issues.push({ severity: 'error', location, message: `Position ${position} has an empty female-turn task.` });
    if (m && f && m === f) {
      issues.push({ severity: 'warning', location, message: `Position ${position} has identical male/female tasks. Keep it only if this is intentional.` });
    }
    if (actionText && !action) {
      issues.push({ severity: 'error', location, message: `Position ${position} has an invalid action "${actionText}". Use empty, move:0, move:12, or move:61.` });
    }
    if (
      maleLegacyAction &&
      femaleLegacyAction &&
      maleLegacyAction.target !== femaleLegacyAction.target
    ) {
      issues.push({ severity: 'error', location, message: `Position ${position} has different legacy movement targets in m/f text. Move it to the action column.` });
    }

    bank[String(position)] = action ? { m, f, action } : { m, f };
  });

  for (let position = FIRST_TASK_POSITION; position <= LAST_TASK_POSITION; position += 1) {
    if (!Object.hasOwn(bank, String(position))) {
      issues.push({ severity: 'error', location: modeId, message: `Missing task position ${position}.` });
    }
  }

  return { bank, issues };
}

export function readTaskSources(modeConfigs = readModeConfigs()) {
  const database = {};
  const issues = [];

  for (const mode of modeConfigs) {
    const sourcePath = taskSourcePath(mode.taskBank);

    if (!fs.existsSync(sourcePath)) {
      issues.push({ severity: 'error', location: mode.id, message: `Missing source file: ${sourcePath}` });
      database[mode.id] = {};
      continue;
    }

    const markdown = fs.readFileSync(sourcePath, 'utf8');
    const parsed = parseTaskMarkdown(markdown, mode.id);
    database[mode.id] = parsed.bank;
    issues.push(...parsed.issues);
  }

  return { database, issues, modes: modeConfigs };
}

export function summarizeIssues(issues) {
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  return { errors, warnings };
}

export function formatIssue(issue) {
  return `[${issue.severity.toUpperCase()}] ${issue.location}: ${issue.message}`;
}

export function writeRuntimeModes(modes) {
  const json = `${JSON.stringify(modes, null, 2)}\n`;
  fs.writeFileSync(repoPath('static', 'modes.json'), json, 'utf8');
}

export function writeRuntimeAppCopy(copy = readAppCopy()) {
  const json = `${JSON.stringify(normalizeAppCopy(copy), null, 2)}\n`;
  fs.writeFileSync(repoPath('static', 'app-copy.json'), json, 'utf8');
}

export function writeTaskDatabase(database, modes = readModeConfigs()) {
  const json = `${JSON.stringify(database, null, 2)}\n`;
  fs.writeFileSync(repoPath('static', 'database.json'), json, 'utf8');
  writeRuntimeModes(modes);
  writeRuntimeAppCopy();
}
