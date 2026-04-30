import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import {
  FIRST_TASK_POSITION,
  LAST_TASK_POSITION,
  DEFAULT_BOARD_BG,
  DEFAULT_ICON,
  MODE_ID_PATTERN,
  formatTaskAction,
  formatIssue,
  normalizeAppCopy,
  normalizeTaskAction,
  readAppCopy,
  parseTaskMarkdown,
  readModeConfigs,
  readTaskSources,
  repoPath,
  summarizeIssues,
  taskSourcePath,
  writeAppCopy,
  writeModeConfigs,
  writeTaskDatabase,
} from './task-bank.mjs';

const hasPlatformPort = Boolean(process.env.PORT);
const port = Number(process.env.PORT || process.env.TASK_ADMIN_PORT || 5199);
const host = process.env.TASK_ADMIN_HOST || process.env.HOST || (hasPlatformPort ? '0.0.0.0' : '127.0.0.1');
const adminRoot = repoPath('tools', 'task-admin');
const appRoot = repoPath('dist-modern');
const runtimeStaticRoot = repoPath('static');
const EXPORT_SCHEMA = 'love-flight-task-package/v1';
const SESSION_COOKIE = 'love_task_admin_session';
const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_LOCK_MS = 60 * 1000;
const secretPath = repoPath('.omx', 'task-admin-password.txt');
const backupRoot = repoPath('.omx', 'task-admin-backups');
const auditLogPath = repoPath('.omx', 'task-admin-audit.jsonl');
let adminPassword = resolveAdminPassword();
const sessions = new Map();
const loginAttempts = new Map();

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

function sendText(res, status, contentType, body) {
  res.writeHead(status, {
    'content-type': `${contentType}; charset=utf-8`,
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.mjs', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.svg', 'image/svg+xml; charset=utf-8'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.webp', 'image/webp'],
    ['.ico', 'image/x-icon'],
    ['.woff', 'font/woff'],
    ['.woff2', 'font/woff2'],
  ]);
  return contentTypes.get(ext) ?? 'application/octet-stream';
}

function sendFile(res, filePath, cacheControl = 'no-store') {
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'content-type': contentTypeFor(filePath),
    'content-length': stat.size,
    'cache-control': cacheControl,
  });
  fs.createReadStream(filePath).pipe(res);
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function resolveAdminPassword() {
  const fromEnv = String(process.env.TASK_ADMIN_PASSWORD ?? '').trim();
  if (fromEnv) {
    return {
      value: fromEnv,
      source: 'env',
      detail: 'TASK_ADMIN_PASSWORD',
    };
  }

  ensureDir(path.dirname(secretPath));
  if (!fs.existsSync(secretPath)) {
    const initialPassword = String(process.env.TASK_ADMIN_INITIAL_PASSWORD ?? '').trim();
    const generated = initialPassword || `love-${crypto.randomBytes(12).toString('base64url')}`;
    fs.writeFileSync(secretPath, `${generated}\n`, { encoding: 'utf8', mode: 0o600 });
  }

  return {
    value: fs.readFileSync(secretPath, 'utf8').trim(),
    source: 'file',
    detail: secretPath,
  };
}

function writeFileAdminPassword(password) {
  ensureDir(path.dirname(secretPath));
  fs.writeFileSync(secretPath, `${password}\n`, { encoding: 'utf8', mode: 0o600 });
  adminPassword = {
    value: password,
    source: 'file',
    detail: secretPath,
  };
}

function validateNewPassword(password) {
  if (password.length < 8) return 'New password must be at least 8 characters.';
  if (password.length > 128) return 'New password must be at most 128 characters.';
  if (/^\s|\s$/.test(password)) return 'New password cannot start or end with whitespace.';
  return null;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie;
  if (!header) return cookies;

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

function getSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  return { token, ...session };
}

function requireAuth(req, res) {
  if (getSession(req)) return true;
  sendJson(res, 401, { error: 'Authentication required.' });
  return false;
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

function registerLoginFailure(ip) {
  const now = Date.now();
  const current = loginAttempts.get(ip);
  const record = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + LOGIN_WINDOW_MS, lockedUntil: 0 };

  record.count += 1;
  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    record.lockedUntil = now + LOGIN_LOCK_MS;
    record.count = 0;
    record.resetAt = now + LOGIN_WINDOW_MS;
  }
  loginAttempts.set(ip, record);
}

function loginLockSeconds(ip) {
  const record = loginAttempts.get(ip);
  if (!record || record.lockedUntil <= Date.now()) return 0;
  return Math.ceil((record.lockedUntil - Date.now()) / 1000);
}

function audit(req, action, detail = {}) {
  ensureDir(path.dirname(auditLogPath));
  const line = JSON.stringify({
    at: new Date().toISOString(),
    ip: req ? clientIp(req) : 'system',
    action,
    detail,
  });
  fs.appendFileSync(auditLogPath, `${line}\n`, 'utf8');
}

function listAudit(limit = 120) {
  if (!fs.existsSync(auditLogPath)) return [];
  const lines = fs.readFileSync(auditLogPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(-limit).reverse().map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { at: '', ip: '', action: 'invalid-log-line', detail: { line } };
    }
  });
}

function backupFileName(reason) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const cleanReason = String(reason).replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').slice(0, 48) || 'manual';
  return `${stamp}-${cleanReason}.json`;
}

function createContentBackup(reason, req = null) {
  ensureDir(backupRoot);
  const name = backupFileName(reason);
  const target = path.join(backupRoot, name);
  fs.writeFileSync(target, `${JSON.stringify(createExportPackage(), null, 2)}\n`, 'utf8');
  audit(req, 'backup:create', { reason, name });
  return name;
}

function safeBackupName(name) {
  const fileName = path.basename(String(name));
  if (fileName !== name || !/^[0-9TZ]+-[a-z0-9_-]+\.json$/i.test(fileName)) return null;
  const target = path.join(backupRoot, fileName);
  if (!target.startsWith(backupRoot)) return null;
  return fileName;
}

function listBackups() {
  if (!fs.existsSync(backupRoot)) return [];
  return fs.readdirSync(backupRoot)
    .filter((name) => safeBackupName(name))
    .map((name) => {
      const fullPath = path.join(backupRoot, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 8_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function markdownCell(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, '<br>')
    .replace(/\|/g, '\\|')
    .trim();
}

function renderModeMarkdown(mode, rows) {
  const lines = [];
  lines.push(`# ${mode.name}（${mode.taskBank ?? mode.id}）`);
  lines.push('');
  lines.push('> 维护说明：男生回合读取 `m` 列，女生回合读取 `f` 列；需要跳格时填写 `动作 action` 列。请保持 1-61 格完整。');
  lines.push('');
  lines.push('| 格子 | 男生回合任务 m | 女生回合任务 f | 动作 action |');
  lines.push('|---:|---|---|---|');

  for (let position = FIRST_TASK_POSITION; position <= LAST_TASK_POSITION; position += 1) {
    const row = rows.find((item) => item.position === position);
    lines.push(`| ${position} | ${markdownCell(row?.m)} | ${markdownCell(row?.f)} | ${formatTaskAction(row?.action)} |`);
  }

  return `${lines.join('\n')}\n`;
}

function rowsFromBank(bank) {
  const rows = [];
  for (let position = FIRST_TASK_POSITION; position <= LAST_TASK_POSITION; position += 1) {
    const entry = bank[String(position)] ?? { m: '', f: '' };
    rows.push({
      position,
      m: entry.m ?? '',
      f: entry.f ?? '',
      action: formatTaskAction(entry.action),
      identical: Boolean(entry.m) && entry.m === entry.f,
    });
  }
  return rows;
}

function readMode(modeId) {
  const mode = readModeConfigs().find((item) => item.id === modeId);
  if (!mode) return null;

  const sourcePath = taskSourcePath(mode.taskBank);
  const markdown = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : '';
  const parsed = parseTaskMarkdown(markdown, modeId);
  const rows = rowsFromBank(parsed.bank);
  const identicalCount = rows.filter((row) => row.identical).length;

  return {
    ...mode,
    rows,
    issues: parsed.issues.map((issue) => ({ ...issue, text: formatIssue(issue) })),
    summary: {
      total: rows.length,
      identical: identicalCount,
      errors: parsed.issues.filter((issue) => issue.severity === 'error').length,
      warnings: parsed.issues.filter((issue) => issue.severity === 'warning').length,
    },
  };
}

function validateRows(rows) {
  if (!Array.isArray(rows)) {
    return ['Rows must be an array.'];
  }

  const issues = [];
  const seen = new Set();

  for (const row of rows) {
    const position = Number(row.position);
    if (!Number.isInteger(position) || position < FIRST_TASK_POSITION || position > LAST_TASK_POSITION) {
      issues.push(`Invalid position: ${row.position}`);
      continue;
    }

    if (seen.has(position)) {
      issues.push(`Duplicate position: ${position}`);
    }
    seen.add(position);

    if (typeof row.m !== 'string') issues.push(`Position ${position}: male-turn task must be text.`);
    if (typeof row.f !== 'string') issues.push(`Position ${position}: female-turn task must be text.`);
    if (row.action !== undefined && row.action !== null && String(row.action).trim() && !normalizeTaskAction(row.action)) {
      issues.push(`Position ${position}: action must be empty, move:0, move:12, or move:61.`);
    }
  }

  for (let position = FIRST_TASK_POSITION; position <= LAST_TASK_POSITION; position += 1) {
    if (!seen.has(position)) issues.push(`Missing position: ${position}`);
  }

  return issues;
}

function modeConfigSummary(mode) {
  const data = readMode(mode.id);
  return {
    ...mode,
    summary: data?.summary ?? { total: 0, identical: 0, errors: 1, warnings: 0 },
  };
}

function validateModeConfigs(modes) {
  if (!Array.isArray(modes)) return ['Modes must be an array.'];

  const issues = [];
  const seen = new Set();

  for (const mode of modes) {
    const id = String(mode.id ?? '').trim();
    if (!MODE_ID_PATTERN.test(id)) {
      issues.push(`Invalid mode id "${id}".`);
    }
    if (seen.has(id)) {
      issues.push(`Duplicate mode id "${id}".`);
    }
    seen.add(id);
    if (!String(mode.name ?? '').trim()) issues.push(`Mode "${id}" needs a display name.`);
    if (!Number.isFinite(Number(mode.order))) issues.push(`Mode "${id}" needs a numeric order.`);
    const taskBank = String(mode.taskBank ?? id).trim();
    if (!MODE_ID_PATTERN.test(taskBank)) {
      issues.push(`Mode "${id}" has an invalid taskBank "${taskBank}".`);
    }
  }

  return issues;
}

function cloneTaskSource(targetTaskBank, copyFromTaskBank) {
  const targetPath = taskSourcePath(targetTaskBank);
  if (fs.existsSync(targetPath)) return;

  const copyPath = taskSourcePath(copyFromTaskBank);
  if (fs.existsSync(copyPath)) {
    fs.copyFileSync(copyPath, targetPath);
    return;
  }

  const blankRows = [];
  for (let position = FIRST_TASK_POSITION; position <= LAST_TASK_POSITION; position += 1) {
    blankRows.push({ position, m: `第${position}格男生任务`, f: `第${position}格女生任务` });
  }
  fs.writeFileSync(targetPath, renderModeMarkdown({ id: targetTaskBank, taskBank: targetTaskBank, name: targetTaskBank }, blankRows), 'utf8');
}

function createExportPackage(modeIds = null) {
  const allModes = readModeConfigs();
  const selectedModes = modeIds ? allModes.filter((mode) => modeIds.includes(mode.id)) : allModes;
  const tasks = {};

  for (const mode of selectedModes) {
    if (tasks[mode.taskBank]) continue;
    const data = readMode(mode.id);
    tasks[mode.taskBank] = (data?.rows ?? []).map((row) => {
      const action = normalizeTaskAction(row.action);
      return {
        position: row.position,
        m: row.m,
        f: row.f,
        ...(action ? { action } : {}),
      };
    });
  }

  return {
    schema: EXPORT_SCHEMA,
    exportedAt: new Date().toISOString(),
    copy: readAppCopy(),
    modes: selectedModes,
    tasks,
  };
}

function validateTaskPackage(taskPackage) {
  const issues = [];
  if (!taskPackage || typeof taskPackage !== 'object') {
    return ['Import file must be a JSON object.'];
  }

  if (taskPackage.schema !== EXPORT_SCHEMA) {
    issues.push(`Unsupported schema "${taskPackage.schema}". Expected "${EXPORT_SCHEMA}".`);
  }

  if (!Array.isArray(taskPackage.modes)) {
    issues.push('Import package must include a modes array.');
  }

  if (!taskPackage.tasks || typeof taskPackage.tasks !== 'object' || Array.isArray(taskPackage.tasks)) {
    issues.push('Import package must include a tasks object.');
  }

  if (taskPackage.copy !== undefined && (!taskPackage.copy || typeof taskPackage.copy !== 'object' || Array.isArray(taskPackage.copy))) {
    issues.push('Import package copy must be a JSON object.');
  }

  if (issues.length > 0) return issues;

  issues.push(...validateModeConfigs(taskPackage.modes));

  for (const mode of taskPackage.modes) {
    const taskBank = String(mode.taskBank ?? mode.id ?? '').trim();
    const rows = taskPackage.tasks[taskBank];
    if (!Array.isArray(rows)) {
      issues.push(`Mode "${mode.id}" is missing tasks["${taskBank}"].`);
      continue;
    }
    for (const issue of validateRows(rows)) {
      issues.push(`${mode.id}: ${issue}`);
    }
  }

  return issues;
}

function importTaskPackage(taskPackage, replace = false) {
  const validationIssues = validateTaskPackage(taskPackage);
  if (validationIssues.length > 0) {
    return { ok: false, issues: validationIssues };
  }

  const importedModes = taskPackage.modes;
  const importedById = new Map(importedModes.map((mode) => [mode.id, mode]));
  const taskBanks = new Set(importedModes.map((mode) => mode.taskBank ?? mode.id));

  for (const taskBank of taskBanks) {
    const owner = importedModes.find((mode) => (mode.taskBank ?? mode.id) === taskBank);
    const rows = taskPackage.tasks[taskBank];
    fs.writeFileSync(taskSourcePath(taskBank), renderModeMarkdown({ ...owner, taskBank }, rows), 'utf8');
  }

  if (taskPackage.copy) {
    writeAppCopy(taskPackage.copy);
  }

  const currentModes = replace ? [] : readModeConfigs().filter((mode) => !importedById.has(mode.id));
  const saved = writeModeConfigs([...currentModes, ...importedModes]);
  const built = buildDatabase();
  return {
    ok: built.ok,
    modes: saved.map(modeConfigSummary),
    built,
  };
}

function getModesSummary() {
  return readModeConfigs().map((mode) => {
    const data = readMode(mode.id);
    return {
      id: mode.id,
      name: mode.name,
      title: mode.title,
      visible: mode.visible,
      order: mode.order,
      taskBank: mode.taskBank,
      summary: data?.summary ?? { total: 0, identical: 0, errors: 1, warnings: 0 },
    };
  });
}

function buildDatabase() {
  const modeConfigs = readModeConfigs();
  const result = readTaskSources(modeConfigs);
  const { errors, warnings } = summarizeIssues(result.issues);
  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
      issues: result.issues.map((issue) => ({ ...issue, text: formatIssue(issue) })),
    };
  }

  writeTaskDatabase(result.database, modeConfigs);
  return {
    ok: true,
    errors,
    warnings,
    issues: result.issues.map((issue) => ({ ...issue, text: formatIssue(issue) })),
    summaries: getModesSummary(),
  };
}

function resolvePublicFile(root, requestPath) {
  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    return null;
  }

  const relativePath = decodedPath.replace(/^[/\\]+/, '');
  const target = path.resolve(root, relativePath);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return target;
}

function serveFileFromRoot(root, requestPath, res, cacheControl = 'no-store') {
  const target = resolvePublicFile(root, requestPath);
  if (!target) {
    sendJson(res, 403, { error: 'Forbidden.' });
    return true;
  }

  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return false;
  }

  sendFile(res, target, cacheControl);
  return true;
}

function redirect(res, location) {
  res.writeHead(302, {
    location,
    'cache-control': 'no-store',
  });
  res.end();
}

function serveAdmin(reqUrl, res) {
  if (reqUrl.pathname === '/admin') {
    redirect(res, '/admin/');
    return;
  }

  const adminPath = reqUrl.pathname.replace(/^\/admin\/?/, '') || 'index.html';
  if (!serveFileFromRoot(adminRoot, adminPath, res)) {
    sendJson(res, 404, { error: 'Not found.' });
  }
}

function serveRuntimeStatic(reqUrl, res) {
  const staticPath = reqUrl.pathname.replace(/^\/static\/?/, '');
  if (!serveFileFromRoot(runtimeStaticRoot, staticPath, res, 'no-store')) {
    sendJson(res, 404, { error: 'Not found.' });
  }
}

function servePublicApp(reqUrl, res) {
  if (!fs.existsSync(path.join(appRoot, 'index.html'))) {
    sendText(res, 503, 'text/plain', 'Player app has not been built. Run "npm run build:modern" first.');
    return;
  }

  const appPath = reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname;
  if (serveFileFromRoot(appRoot, appPath, res, reqUrl.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-store')) {
    return;
  }

  sendFile(res, path.join(appRoot, 'index.html'));
}

async function handleAuth(req, res, reqUrl) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/status') {
    const session = getSession(req);
    const payload = {
      authenticated: Boolean(session),
      sessionMaxAgeSeconds: SESSION_MAX_AGE_SECONDS,
    };
    if (session) {
      payload.passwordSource = adminPassword.source;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/login') {
    const ip = clientIp(req);
    const lockedSeconds = loginLockSeconds(ip);
    if (lockedSeconds > 0) {
      sendJson(res, 429, { error: `Too many failed login attempts. Try again in ${lockedSeconds}s.` });
      return;
    }

    const payload = await readJsonBody(req);
    const password = String(payload.password ?? '');
    if (!safeEqual(password, adminPassword.value)) {
      registerLoginFailure(ip);
      audit(req, 'auth:login-failed');
      sendJson(res, 401, { error: 'Invalid password.' });
      return;
    }

    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, {
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_MAX_AGE_MS,
      ip,
    });
    audit(req, 'auth:login');
    sendJson(res, 200, { authenticated: true }, { 'set-cookie': sessionCookie(token) });
    return;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/logout') {
    const session = getSession(req);
    if (session) sessions.delete(session.token);
    audit(req, 'auth:logout');
    sendJson(res, 200, { authenticated: false }, { 'set-cookie': expiredSessionCookie() });
    return;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/password') {
    const session = getSession(req);
    if (!session) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    if (adminPassword.source === 'env') {
      sendJson(res, 409, { error: 'Password is managed by TASK_ADMIN_PASSWORD and cannot be changed in the admin UI.' });
      return;
    }

    const payload = await readJsonBody(req);
    const currentPassword = String(payload.currentPassword ?? '');
    const newPassword = String(payload.newPassword ?? '');
    if (!safeEqual(currentPassword, adminPassword.value)) {
      audit(req, 'auth:password-change-failed');
      sendJson(res, 401, { error: 'Current password is incorrect.' });
      return;
    }

    const validationError = validateNewPassword(newPassword);
    if (validationError) {
      sendJson(res, 400, { error: validationError });
      return;
    }

    if (safeEqual(newPassword, adminPassword.value)) {
      sendJson(res, 400, { error: 'New password must be different from the current password.' });
      return;
    }

    writeFileAdminPassword(newPassword);
    for (const token of sessions.keys()) {
      if (token !== session.token) sessions.delete(token);
    }
    audit(req, 'auth:password-change');
    sendJson(res, 200, { ok: true, passwordSource: adminPassword.source });
    return;
  }

  sendJson(res, 404, { error: 'Auth API not found.' });
}

async function handleApi(req, res, reqUrl) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/modes') {
    sendJson(res, 200, { modes: getModesSummary() });
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/export') {
    sendJson(res, 200, createExportPackage());
    return;
  }

  const exportMatch = reqUrl.pathname.match(/^\/api\/export\/([a-z][a-z0-9_-]*)$/);
  if (req.method === 'GET' && exportMatch) {
    const modeId = exportMatch[1];
    if (!readModeConfigs().some((mode) => mode.id === modeId)) {
      sendJson(res, 404, { error: 'Unknown mode.' });
      return;
    }
    sendJson(res, 200, createExportPackage([modeId]));
    return;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/import') {
    const payload = await readJsonBody(req);
    const taskPackage = payload.package ?? payload;
    createContentBackup('before-import', req);
    const result = importTaskPackage(taskPackage, payload.replace === true);
    if (!result.ok) {
      sendJson(res, 400, {
        error: result.issues ? 'Invalid import package.' : 'Import completed, but generated task database has errors.',
        ...result,
      });
      return;
    }

    audit(req, 'tasks:import', {
      replace: payload.replace === true,
      modes: Array.isArray(taskPackage.modes) ? taskPackage.modes.map((mode) => mode.id) : [],
    });
    sendJson(res, 200, result);
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/mode-configs') {
    sendJson(res, 200, { modes: readModeConfigs().map(modeConfigSummary) });
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/app-copy') {
    sendJson(res, 200, { copy: readAppCopy() });
    return;
  }

  if (req.method === 'PUT' && reqUrl.pathname === '/api/app-copy') {
    const payload = await readJsonBody(req);
    createContentBackup('before-copy-save', req);
    const copy = writeAppCopy(normalizeAppCopy(payload.copy ?? payload));
    const built = buildDatabase();
    audit(req, 'copy:save');
    sendJson(res, built.ok ? 200 : 400, { copy, built });
    return;
  }

  if (req.method === 'PUT' && reqUrl.pathname === '/api/mode-configs') {
    const payload = await readJsonBody(req);
    const validationIssues = validateModeConfigs(payload.modes);
    if (validationIssues.length > 0) {
      sendJson(res, 400, { error: 'Invalid mode configs.', issues: validationIssues });
      return;
    }

    createContentBackup('before-mode-config-save', req);
    const saved = writeModeConfigs(payload.modes);
    const built = buildDatabase();
    audit(req, 'modes:save', { count: saved.length });
    if (!built.ok) {
      sendJson(res, 400, { modes: saved.map(modeConfigSummary), built });
      return;
    }
    sendJson(res, 200, { modes: saved.map(modeConfigSummary), built });
    return;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/mode-configs') {
    const payload = await readJsonBody(req);
    const id = String(payload.id ?? '').trim();
    if (!MODE_ID_PATTERN.test(id)) {
      sendJson(res, 400, { error: 'Invalid mode id. Use lowercase letters, numbers, "_" or "-".' });
      return;
    }

    const modes = readModeConfigs();
    if (modes.some((mode) => mode.id === id)) {
      sendJson(res, 400, { error: `Mode "${id}" already exists.` });
      return;
    }

    const copyFrom = String(payload.copyFrom ?? modes[0]?.taskBank ?? 'qinglu').trim();
    const maxOrder = modes.reduce((max, mode) => Math.max(max, Number(mode.order) || 0), 0);
    const mode = {
      id,
      name: String(payload.name ?? id).trim() || id,
      title: String(payload.title ?? `${payload.name ?? id}飞行棋`).trim(),
      visible: payload.visible === true,
      order: maxOrder + 1,
      taskBank: id,
      icon: DEFAULT_ICON,
      accent: '#c83a2d',
      soft: '#2b1715',
      boardBg: DEFAULT_BOARD_BG,
    };

    createContentBackup('before-mode-add', req);
    cloneTaskSource(mode.taskBank, copyFrom);
    const saved = writeModeConfigs([...modes, mode]);
    const built = buildDatabase();
    audit(req, 'modes:add', { id: mode.id, copyFrom });
    sendJson(res, built.ok ? 200 : 400, { mode: modeConfigSummary(mode), modes: saved.map(modeConfigSummary), built });
    return;
  }

  const modeMatch = reqUrl.pathname.match(/^\/api\/modes\/([a-z][a-z0-9_-]*)$/);
  if (req.method === 'GET' && modeMatch) {
    const mode = readMode(modeMatch[1]);
    if (!mode) {
      sendJson(res, 404, { error: 'Unknown mode.' });
      return;
    }
    sendJson(res, 200, { mode });
    return;
  }

  if (req.method === 'PUT' && modeMatch) {
    const mode = readModeConfigs().find((item) => item.id === modeMatch[1]);
    if (!mode) {
      sendJson(res, 404, { error: 'Unknown mode.' });
      return;
    }

    const payload = await readJsonBody(req);
    const validationIssues = validateRows(payload.rows);
    if (validationIssues.length > 0) {
      sendJson(res, 400, { error: 'Invalid rows.', issues: validationIssues });
      return;
    }

    createContentBackup(`before-task-save-${mode.id}`, req);
    fs.writeFileSync(taskSourcePath(mode.taskBank), renderModeMarkdown(mode, payload.rows), 'utf8');
    audit(req, 'tasks:save', { id: mode.id, build: payload.build === true });

    const response = { mode: readMode(mode.id), built: null };
    if (payload.build === true) {
      const built = buildDatabase();
      response.built = built;
      if (!built.ok) {
        sendJson(res, 400, response);
        return;
      }
    }

    sendJson(res, 200, response);
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/check') {
    const { issues } = readTaskSources();
    const { errors, warnings } = summarizeIssues(issues);
    sendJson(res, 200, {
      ok: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      issues: issues.map((issue) => ({ ...issue, text: formatIssue(issue) })),
      modes: getModesSummary(),
    });
    return;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/build') {
    const built = buildDatabase();
    audit(req, 'runtime:build', { ok: built.ok });
    sendJson(res, built.ok ? 200 : 400, built);
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backups') {
    sendJson(res, 200, { backups: listBackups() });
    return;
  }

  const backupRestoreMatch = reqUrl.pathname.match(/^\/api\/backups\/([^/]+)\/restore$/);
  if (req.method === 'POST' && backupRestoreMatch) {
    const name = safeBackupName(decodeURIComponent(backupRestoreMatch[1]));
    if (!name) {
      sendJson(res, 400, { error: 'Invalid backup name.' });
      return;
    }
    const target = path.join(backupRoot, name);
    if (!fs.existsSync(target)) {
      sendJson(res, 404, { error: 'Backup not found.' });
      return;
    }

    createContentBackup('before-restore', req);
    const taskPackage = JSON.parse(fs.readFileSync(target, 'utf8'));
    const result = importTaskPackage(taskPackage, true);
    audit(req, 'backup:restore', { name, ok: result.ok });
    sendJson(res, result.ok ? 200 : 400, result);
    return;
  }

  const backupDownloadMatch = reqUrl.pathname.match(/^\/api\/backups\/([^/]+)$/);
  if (req.method === 'GET' && backupDownloadMatch) {
    const name = safeBackupName(decodeURIComponent(backupDownloadMatch[1]));
    if (!name) {
      sendJson(res, 400, { error: 'Invalid backup name.' });
      return;
    }
    const target = path.join(backupRoot, name);
    if (!fs.existsSync(target)) {
      sendJson(res, 404, { error: 'Backup not found.' });
      return;
    }
    sendText(res, 200, 'application/json', fs.readFileSync(target, 'utf8'));
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/audit') {
    sendJson(res, 200, { logs: listAudit() });
    return;
  }

  sendJson(res, 404, { error: 'API not found.' });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (reqUrl.pathname.startsWith('/api/auth/')) {
    handleAuth(req, res, reqUrl).catch((error) => {
      sendJson(res, 500, { error: error.message });
    });
  } else if (reqUrl.pathname.startsWith('/api/')) {
    if (!requireAuth(req, res)) return;
    handleApi(req, res, reqUrl).catch((error) => {
      sendJson(res, 500, { error: error.message });
    });
  } else if (reqUrl.pathname === '/admin' || reqUrl.pathname.startsWith('/admin/')) {
    serveAdmin(reqUrl, res);
  } else if (reqUrl.pathname === '/static' || reqUrl.pathname.startsWith('/static/')) {
    serveRuntimeStatic(reqUrl, res);
  } else {
    servePublicApp(reqUrl, res);
  }
});

server.listen(port, host, () => {
  const scriptName = path.basename(fileURLToPath(import.meta.url));
  console.log(`Love Flight server running at http://${host}:${port}`);
  console.log(`Player app: http://${host}:${port}/`);
  console.log(`Task admin: http://${host}:${port}/admin/`);
  console.log(`Admin password source: ${adminPassword.detail}`);
  console.log(`Stop with Ctrl+C. Server: ${scriptName}`);
});
