const state = {
  modes: [],
  modeConfigs: [],
  activeModeId: null,
  activeMode: null,
  rows: [],
  appCopy: {},
  backups: [],
  auditLogs: [],
  auth: null,
  authenticated: false,
  dirty: false,
  modeConfigDirty: false,
  copyDirty: false,
  query: '',
  filter: 'all',
  view: 'tasks',
};

const COPY_FIELDS = [
  ['documentTitle', '浏览器标题'],
  ['homeTitle', '首页主标题'],
  ['homeSubtitle', '首页副标题'],
  ['homeDescriptionLabel', '首页说明标题'],
  ['homeDescription', '首页说明正文', true],
  ['startButtonPrefix', '开始按钮前缀'],
  ['gameTitle', '游戏页顶部标题'],
  ['boyLabel', '男生称呼'],
  ['girlLabel', '女生称呼'],
  ['turnLabelTemplate', '当前回合，使用 {player}'],
  ['boardStartLabel', '棋盘起点文字'],
  ['boardEndLabel', '棋盘终点文字'],
  ['diceCaption', '骰子下方提示'],
  ['ageGateSuffix', '年龄提示后缀'],
  ['ageGateDescription', '年龄弹窗说明', true],
  ['ageGateRulesButton', '年龄弹窗玩法按钮'],
  ['ageGateAgreeButton', '年龄弹窗确认按钮'],
  ['rulesTitleSuffix', '玩法弹窗标题后缀'],
  ['rulesIntro', '玩法弹窗第一段', true],
  ['rulesTaskDescription', '玩法弹窗第二段', true],
  ['rulesConfirmButton', '玩法弹窗确认按钮'],
  ['restartButton', '重新开始按钮'],
  ['homeButton', '返回主页按钮'],
  ['taskTitleSuffix', '任务弹窗标题后缀'],
  ['taskCompleteButton', '任务完成按钮'],
  ['taskSkipButton', '任务换一个按钮'],
  ['timerTitle', '倒计时标题'],
  ['timerDoneButton', '倒计时完成按钮'],
  ['timerRunningButton', '倒计时执行中按钮'],
  ['timerStartButton', '倒计时开始按钮'],
  ['timerPauseButton', '倒计时暂停按钮'],
  ['timerResumeButton', '倒计时继续按钮'],
  ['timerResetButton', '倒计时重置按钮'],
  ['victoryTitle', '胜利弹窗标题'],
  ['victoryMessageTemplate', '胜利文案，使用 {player}', true],
  ['victoryTurnsPrefix', '胜利掷骰前缀'],
  ['victoryTurnsSuffix', '胜利掷骰后缀'],
  ['victoryTasksPrefix', '胜利任务前缀'],
  ['victoryTasksSuffix', '胜利任务后缀'],
  ['victoryGeneratingLabel', '生成中按钮文字'],
  ['victoryGenerateButton', '生成回忆卡按钮'],
  ['replayButton', '再来一局按钮'],
  ['reviewModalTitle', '回忆卡弹窗标题'],
  ['reviewBackButton', '回忆卡返回按钮'],
  ['reviewImageAlt', '回忆卡图片描述'],
  ['reviewCardTitle', '回忆卡主标题'],
  ['reviewCardSubtitle', '回忆卡副标题'],
  ['reviewWinnerLabel', '回忆卡赢家，使用 {player}'],
  ['reviewRollsLabel', '回忆卡掷骰标签'],
  ['reviewRollsSuffix', '回忆卡掷骰后缀'],
  ['reviewTasksLabel', '回忆卡任务标签'],
  ['reviewTasksSuffix', '回忆卡任务后缀'],
  ['reviewPrizeLabel', '回忆卡奖励标签'],
  ['reviewPrizeText', '回忆卡奖励正文', true],
  ['reviewFooter', '回忆卡底部文字'],
];

const els = {
  authScreen: document.querySelector('#authScreen'),
  adminShell: document.querySelector('#adminShell'),
  loginForm: document.querySelector('#loginForm'),
  loginPassword: document.querySelector('#loginPassword'),
  loginBtn: document.querySelector('#loginBtn'),
  authHint: document.querySelector('#authHint'),
  authMessage: document.querySelector('#authMessage'),
  taskViewBtn: document.querySelector('#taskViewBtn'),
  modeViewBtn: document.querySelector('#modeViewBtn'),
  copyViewBtn: document.querySelector('#copyViewBtn'),
  securityViewBtn: document.querySelector('#securityViewBtn'),
  taskWorkspace: document.querySelector('#taskWorkspace'),
  modeWorkspace: document.querySelector('#modeWorkspace'),
  copyWorkspace: document.querySelector('#copyWorkspace'),
  securityWorkspace: document.querySelector('#securityWorkspace'),
  modeTabs: document.querySelector('#modeTabs'),
  modeStats: document.querySelector('#modeStats'),
  modeKicker: document.querySelector('#modeKicker'),
  modeTitle: document.querySelector('#modeTitle'),
  taskRows: document.querySelector('#taskRows'),
  searchInput: document.querySelector('#searchInput'),
  filterSelect: document.querySelector('#filterSelect'),
  dirtyState: document.querySelector('#dirtyState'),
  issueList: document.querySelector('#issueList'),
  toast: document.querySelector('#toast'),
  saveBtn: document.querySelector('#saveBtn'),
  saveBuildBtn: document.querySelector('#saveBuildBtn'),
  checkBtn: document.querySelector('#checkBtn'),
  buildBtn: document.querySelector('#buildBtn'),
  exportModeBtn: document.querySelector('#exportModeBtn'),
  clearIssuesBtn: document.querySelector('#clearIssuesBtn'),
  exportAllBtn: document.querySelector('#exportAllBtn'),
  importPackageBtn: document.querySelector('#importPackageBtn'),
  importFileInput: document.querySelector('#importFileInput'),
  addModeBtn: document.querySelector('#addModeBtn'),
  saveModesBtn: document.querySelector('#saveModesBtn'),
  modeConfigRows: document.querySelector('#modeConfigRows'),
  saveCopyBtn: document.querySelector('#saveCopyBtn'),
  copyFields: document.querySelector('#copyFields'),
  refreshSecurityBtn: document.querySelector('#refreshSecurityBtn'),
  logoutBtn: document.querySelector('#logoutBtn'),
  securityStats: document.querySelector('#securityStats'),
  passwordForm: document.querySelector('#passwordForm'),
  passwordHelp: document.querySelector('#passwordHelp'),
  currentPassword: document.querySelector('#currentPassword'),
  newPassword: document.querySelector('#newPassword'),
  confirmPassword: document.querySelector('#confirmPassword'),
  changePasswordBtn: document.querySelector('#changePasswordBtn'),
  backupRows: document.querySelector('#backupRows'),
  auditRows: document.querySelector('#auditRows'),
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.data = data;
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      setAuthenticated(false);
    }
    throw error;
  }
  return data;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function safeDateName() {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
}

function downloadJson(filename, data) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function setView(view) {
  state.view = view;
  els.taskWorkspace.classList.toggle('hidden', view !== 'tasks');
  els.modeWorkspace.classList.toggle('hidden', view !== 'modes');
  els.copyWorkspace.classList.toggle('hidden', view !== 'copy');
  els.securityWorkspace.classList.toggle('hidden', view !== 'security');
  els.taskViewBtn.classList.toggle('active', view === 'tasks');
  els.modeViewBtn.classList.toggle('active', view === 'modes');
  els.copyViewBtn.classList.toggle('active', view === 'copy');
  els.securityViewBtn.classList.toggle('active', view === 'security');
}

function setAuthenticated(authenticated) {
  state.authenticated = authenticated;
  els.authScreen.classList.toggle('hidden', authenticated);
  els.adminShell.classList.toggle('locked', !authenticated);
  if (!authenticated) {
    els.loginPassword.value = '';
    window.setTimeout(() => els.loginPassword.focus(), 0);
  }
}

function setDirty(value) {
  state.dirty = value;
  els.dirtyState.textContent = value ? '未保存' : '已保存';
  els.dirtyState.classList.toggle('dirty', value);
}

function setModeConfigDirty(value) {
  state.modeConfigDirty = value;
  els.saveModesBtn.textContent = value ? '保存并生成*' : '保存并生成';
}

function setCopyDirty(value) {
  state.copyDirty = value;
  els.saveCopyBtn.textContent = value ? '保存并生成*' : '保存并生成';
}

function modeWarningText(summary) {
  if (!summary) return '';
  if (summary.errors > 0) return `${summary.errors} 错误`;
  if (summary.identical > 0) return `${summary.identical} 相同`;
  return '正常';
}

function renderModeTabs() {
  els.modeTabs.replaceChildren();
  for (const mode of state.modes) {
    const button = document.createElement('button');
    button.className = `mode-tab${mode.id === state.activeModeId ? ' active' : ''}`;
    button.type = 'button';
    button.dataset.modeId = mode.id;

    const name = document.createElement('span');
    name.textContent = mode.name;
    const meta = document.createElement('small');
    const visible = mode.visible ? '显示' : '隐藏';
    meta.textContent = `${visible} · ${modeWarningText(mode.summary)}`;

    button.append(name, meta);
    els.modeTabs.append(button);
  }
}

function renderStats() {
  const summary = state.activeMode?.summary;
  const stats = [
    ['总格子', summary?.total ?? 0],
    ['男女相同', summary?.identical ?? 0],
    ['错误', summary?.errors ?? 0],
    ['提醒', summary?.warnings ?? 0],
  ];

  els.modeStats.replaceChildren();
  for (const [label, value] of stats) {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    row.append(dt, dd);
    els.modeStats.append(row);
  }
}

function rowStatus(row) {
  if (!row.m.trim() || !row.f.trim()) return { className: 'error', text: '空' };
  if (row.action?.trim()) return { className: 'warn', text: '跳转' };
  if (row.m === row.f) return { className: 'warn', text: '相同' };
  return { className: 'ok', text: '双轨' };
}

function rowMatches(row) {
  const query = state.query.trim().toLowerCase();
  if (query) {
    const haystack = `${row.position} ${row.m} ${row.f} ${row.action ?? ''}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (state.filter === 'identical') return row.m === row.f;
  if (state.filter === 'different') return row.m !== row.f;
  if (state.filter === 'empty') return !row.m.trim() || !row.f.trim();
  return true;
}

function makeTextarea(row, field) {
  const textarea = document.createElement('textarea');
  textarea.className = 'task-input';
  textarea.value = row[field];
  textarea.dataset.position = String(row.position);
  textarea.dataset.field = field;
  textarea.rows = 2;
  return textarea;
}

function makeActionInput(row) {
  const input = document.createElement('input');
  input.className = 'action-input';
  input.value = row.action ?? '';
  input.dataset.position = String(row.position);
  input.dataset.field = 'action';
  input.placeholder = '空 / move:0 / move:12 / move:61';
  return input;
}

function renderRows() {
  els.taskRows.replaceChildren();
  const fragment = document.createDocumentFragment();
  const visibleRows = state.rows.filter(rowMatches);

  for (const row of visibleRows) {
    const tr = document.createElement('tr');
    tr.dataset.position = String(row.position);

    const posCell = document.createElement('td');
    const posBadge = document.createElement('span');
    posBadge.className = 'pos-badge';
    posBadge.textContent = row.position;
    posCell.append(posBadge);

    const maleCell = document.createElement('td');
    maleCell.append(makeTextarea(row, 'm'));

    const femaleCell = document.createElement('td');
    femaleCell.append(makeTextarea(row, 'f'));

    const actionCell = document.createElement('td');
    actionCell.append(makeActionInput(row));

    const stateCell = document.createElement('td');
    const status = rowStatus(row);
    const statePill = document.createElement('span');
    statePill.className = `state-pill ${status.className}`;
    statePill.textContent = status.text;
    stateCell.append(statePill);

    tr.append(posCell, maleCell, femaleCell, actionCell, stateCell);
    fragment.append(tr);
  }

  if (visibleRows.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = '没有匹配的格子';
    td.style.padding = '24px';
    td.style.color = '#667085';
    tr.append(td);
    fragment.append(tr);
  }

  els.taskRows.append(fragment);
}

function renderModeHeader() {
  if (!state.activeMode) return;
  els.modeKicker.textContent = `${state.activeMode.id} · ${state.activeMode.visible ? '前台展示' : '后台隐藏'}`;
  els.modeTitle.textContent = state.activeMode.name;
}

function renderIssues(issues) {
  els.issueList.replaceChildren();
  if (!issues || issues.length === 0) {
    els.issueList.textContent = '没有错误或提醒';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const issue of issues.slice(0, 180)) {
    const item = document.createElement('div');
    const severity = typeof issue === 'string' ? 'error' : issue.severity;
    item.className = `issue-item ${severity}`;
    item.textContent = typeof issue === 'string'
      ? issue
      : issue.text || `[${issue.severity}] ${issue.location}: ${issue.message}`;
    fragment.append(item);
  }

  if (issues.length > 180) {
    const item = document.createElement('div');
    item.className = 'issue-item warning';
    item.textContent = `还有 ${issues.length - 180} 条未显示`;
    fragment.append(item);
  }
  els.issueList.append(fragment);
}

function refreshRowStatus(position) {
  const row = state.rows.find((item) => item.position === position);
  const tr = els.taskRows.querySelector(`tr[data-position="${position}"]`);
  if (!row || !tr) return;
  const pill = tr.querySelector('.state-pill');
  const status = rowStatus(row);
  pill.className = `state-pill ${status.className}`;
  pill.textContent = status.text;
}

function updateCurrentSummary() {
  if (!state.activeMode) return;
  const identical = state.rows.filter((row) => row.m === row.f).length;
  const empty = state.rows.filter((row) => !row.m.trim() || !row.f.trim()).length;
  state.activeMode.summary = {
    total: state.rows.length,
    identical,
    errors: empty,
    warnings: identical,
  };

  const mode = state.modes.find((item) => item.id === state.activeModeId);
  if (mode) mode.summary = state.activeMode.summary;
  renderStats();
  renderModeTabs();
}

function makeModeInput(mode, field, readonly = false) {
  const input = document.createElement('input');
  input.className = 'mode-input';
  input.value = mode[field] ?? '';
  input.dataset.modeId = mode.id;
  input.dataset.field = field;
  input.readOnly = readonly;
  return input;
}

function renderModeConfigs() {
  els.modeConfigRows.replaceChildren();
  const fragment = document.createDocumentFragment();

  for (const mode of state.modeConfigs) {
    const tr = document.createElement('tr');
    tr.dataset.modeId = mode.id;

    const visibleCell = document.createElement('td');
    const visible = document.createElement('input');
    visible.type = 'checkbox';
    visible.className = 'visible-toggle';
    visible.checked = Boolean(mode.visible);
    visible.dataset.modeId = mode.id;
    visible.dataset.field = 'visible';
    visibleCell.append(visible);

    const orderCell = document.createElement('td');
    const order = makeModeInput(mode, 'order');
    order.type = 'number';
    order.min = '1';
    orderCell.append(order);

    const idCell = document.createElement('td');
    idCell.append(makeModeInput(mode, 'id', true));

    const nameCell = document.createElement('td');
    nameCell.append(makeModeInput(mode, 'name'));

    const titleCell = document.createElement('td');
    titleCell.append(makeModeInput(mode, 'title'));

    const bankCell = document.createElement('td');
    bankCell.append(makeModeInput(mode, 'taskBank', true));

    const stateCell = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = `state-pill ${mode.summary?.errors ? 'error' : mode.visible ? 'ok' : 'warn'}`;
    pill.textContent = mode.visible ? '展示' : '隐藏';
    stateCell.append(pill);

    tr.append(visibleCell, orderCell, idCell, nameCell, titleCell, bankCell, stateCell);
    fragment.append(tr);
  }

  els.modeConfigRows.append(fragment);
}

function renderAppCopy() {
  els.copyFields.replaceChildren();
  const fragment = document.createDocumentFragment();

  for (const [field, label, multiline] of COPY_FIELDS) {
    const wrapper = document.createElement('label');
    wrapper.className = `copy-field${multiline ? ' wide' : ''}`;

    const labelNode = document.createElement('span');
    labelNode.textContent = label;

    const input = document.createElement(multiline ? 'textarea' : 'input');
    input.className = 'copy-input';
    input.dataset.field = field;
    input.value = state.appCopy[field] ?? '';
    if (multiline) input.rows = 3;

    wrapper.append(labelNode, input);
    fragment.append(wrapper);
  }

  els.copyFields.append(fragment);
}

function formatBytes(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function renderSecurity() {
  const stats = [
    ['登录状态', state.authenticated ? '已登录' : '未登录'],
    ['密码来源', state.auth?.passwordSource === 'env' ? '环境变量' : '本地密码文件'],
    ['密码说明', state.auth?.passwordSource === 'env' ? '由服务器环境变量提供' : '由服务器本地密码文件提供'],
    ['备份数量', state.backups.length],
    ['最近备份', state.backups[0]?.updatedAt ? new Date(state.backups[0].updatedAt).toLocaleString() : '-'],
    ['日志条数', state.auditLogs.length],
  ];

  els.securityStats.replaceChildren();
  for (const [label, value] of stats) {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    row.append(dt, dd);
    els.securityStats.append(row);
  }

  const passwordManagedByEnv = state.auth?.passwordSource === 'env';
  els.passwordHelp.textContent = passwordManagedByEnv
    ? '当前密码由服务器环境变量 TASK_ADMIN_PASSWORD 管理，需要在服务器环境变量中修改。'
    : '适合设置临时维护密码。修改后其它已登录会话会失效。';
  for (const input of [els.currentPassword, els.newPassword, els.confirmPassword]) {
    input.disabled = passwordManagedByEnv;
  }
  els.changePasswordBtn.disabled = passwordManagedByEnv;

  els.backupRows.replaceChildren();
  const backupFragment = document.createDocumentFragment();
  for (const backup of state.backups) {
    const tr = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = backup.name;

    const timeCell = document.createElement('td');
    timeCell.textContent = new Date(backup.updatedAt).toLocaleString();

    const sizeCell = document.createElement('td');
    sizeCell.textContent = formatBytes(backup.size);

    const actionCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'backup-actions';
    const download = document.createElement('button');
    download.className = 'mini-btn';
    download.type = 'button';
    download.dataset.action = 'download';
    download.dataset.name = backup.name;
    download.textContent = '下载';
    const restore = document.createElement('button');
    restore.className = 'mini-btn danger';
    restore.type = 'button';
    restore.dataset.action = 'restore';
    restore.dataset.name = backup.name;
    restore.textContent = '恢复';
    actions.append(download, restore);
    actionCell.append(actions);

    tr.append(nameCell, timeCell, sizeCell, actionCell);
    backupFragment.append(tr);
  }

  if (state.backups.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = '暂无备份。保存题库、前台显示、前台文案或导入包时会自动创建备份。';
    td.style.padding = '24px';
    td.style.color = '#667085';
    tr.append(td);
    backupFragment.append(tr);
  }

  els.backupRows.append(backupFragment);

  els.auditRows.replaceChildren();
  if (state.auditLogs.length === 0) {
    els.auditRows.textContent = '暂无操作记录';
    return;
  }

  const auditFragment = document.createDocumentFragment();
  for (const log of state.auditLogs) {
    const item = document.createElement('div');
    item.className = 'audit-item';
    const detail = log.detail && Object.keys(log.detail).length > 0 ? ` · ${JSON.stringify(log.detail)}` : '';
    const action = document.createElement('strong');
    action.textContent = log.action;
    item.append(action, ` · ${new Date(log.at).toLocaleString()} · ${log.ip}${detail}`);
    auditFragment.append(item);
  }
  els.auditRows.append(auditFragment);
}

async function loadModes() {
  const data = await request('/api/modes');
  state.modes = data.modes;
  if (!state.activeModeId) {
    state.activeModeId = state.modes[0]?.id ?? null;
  }
  renderModeTabs();
}

async function loadModeConfigs() {
  const data = await request('/api/mode-configs');
  state.modeConfigs = data.modes.map((mode) => ({ ...mode }));
  setModeConfigDirty(false);
  renderModeConfigs();
}

async function loadAppCopy() {
  const data = await request('/api/app-copy');
  state.appCopy = { ...data.copy };
  setCopyDirty(false);
  renderAppCopy();
}

async function loadSecurity() {
  const [auth, backups, audit] = await Promise.all([
    request('/api/auth/status'),
    request('/api/backups'),
    request('/api/audit'),
  ]);
  state.auth = auth;
  state.backups = backups.backups;
  state.auditLogs = audit.logs;
  renderSecurity();
}

async function login(password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  state.auth = data;
  setAuthenticated(true);
  await loadAll();
  showToast('已登录后台');
}

async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST', body: '{}' });
  } catch {
    // Ignore logout network failures and still clear the local UI state.
  }
  setAuthenticated(false);
}

async function changePassword() {
  const currentPassword = els.currentPassword.value;
  const newPassword = els.newPassword.value;
  const confirmPassword = els.confirmPassword.value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('请填写当前密码、新密码和确认密码');
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast('两次输入的新密码不一致');
    return;
  }

  els.changePasswordBtn.disabled = true;
  try {
    const data = await request('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    state.auth = { ...(state.auth ?? {}), passwordSource: data.passwordSource ?? state.auth?.passwordSource };
    els.currentPassword.value = '';
    els.newPassword.value = '';
    els.confirmPassword.value = '';
    await loadSecurity();
    showToast('后台密码已修改');
  } catch (error) {
    showToast(error.message);
  } finally {
    if (state.auth?.passwordSource !== 'env') {
      els.changePasswordBtn.disabled = false;
    }
  }
}

async function checkAuth() {
  const data = await request('/api/auth/status');
  state.auth = data;
  els.authHint.textContent = '请输入后台维护密码。';
  setAuthenticated(data.authenticated);
  return data.authenticated;
}

async function loadMode(modeId) {
  const data = await request(`/api/modes/${modeId}`);
  state.activeModeId = modeId;
  state.activeMode = data.mode;
  state.rows = data.mode.rows.map((row) => ({ position: row.position, m: row.m, f: row.f, action: row.action ?? '' }));
  setDirty(false);
  renderModeTabs();
  renderModeHeader();
  renderStats();
  renderRows();
  renderIssues(data.mode.issues);
}

async function saveMode(build = false) {
  if (!state.activeModeId) return;
  els.saveBtn.disabled = true;
  els.saveBuildBtn.disabled = true;

  try {
    const data = await request(`/api/modes/${state.activeModeId}`, {
      method: 'PUT',
      body: JSON.stringify({ rows: state.rows, build }),
    });
    state.activeMode = data.mode;
    state.rows = data.mode.rows.map((row) => ({ position: row.position, m: row.m, f: row.f, action: row.action ?? '' }));
    setDirty(false);
    await loadModes();
    renderModeHeader();
    renderStats();
    renderRows();
    renderIssues(data.built?.issues ?? data.mode.issues);
    showToast(build ? '已保存并生成运行题库' : '已保存源文件');
  } catch (error) {
    showToast(error.message);
  } finally {
    els.saveBtn.disabled = false;
    els.saveBuildBtn.disabled = false;
  }
}

async function saveModeConfigs() {
  try {
    const data = await request('/api/mode-configs', {
      method: 'PUT',
      body: JSON.stringify({ modes: state.modeConfigs }),
    });
    state.modeConfigs = data.modes.map((mode) => ({ ...mode }));
    setModeConfigDirty(false);
    renderModeConfigs();
    await loadModes();
    renderIssues(data.built?.issues ?? []);
    showToast('前台显示配置已保存并生成');
  } catch (error) {
    showToast(error.message);
  }
}

async function saveAppCopy() {
  try {
    const data = await request('/api/app-copy', {
      method: 'PUT',
      body: JSON.stringify({ copy: state.appCopy }),
    });
    state.appCopy = { ...data.copy };
    setCopyDirty(false);
    renderAppCopy();
    renderIssues(data.built?.issues ?? []);
    showToast('前台文案已保存并生成');
  } catch (error) {
    showToast(error.message);
  }
}

async function addModeConfig() {
  const id = window.prompt('输入新项目 ID（小写字母/数字/_/-，例如 custom01）');
  if (!id) return;
  const name = window.prompt('输入首页显示名称', id) || id;
  try {
    const data = await request('/api/mode-configs', {
      method: 'POST',
      body: JSON.stringify({ id, name, title: `${name}飞行棋`, copyFrom: state.activeMode?.taskBank || 'qinglu', visible: false }),
    });
    state.modeConfigs = data.modes.map((mode) => ({ ...mode }));
    setModeConfigDirty(false);
    renderModeConfigs();
    await loadModes();
    showToast(`已新增 ${data.mode.name}`);
  } catch (error) {
    showToast(error.message);
  }
}

async function runCheck() {
  try {
    const data = await request('/api/check');
    state.modes = data.modes;
    renderModeTabs();
    renderIssues(data.issues);
    showToast(`检查完成：${data.errorCount} 错误，${data.warningCount} 提醒`);
  } catch (error) {
    showToast(error.message);
  }
}

async function runBuild() {
  try {
    if (state.dirty && !window.confirm('当前模式还有未保存内容。先保存后再生成？')) return;
    if (state.dirty) await saveMode(false);
    if (state.modeConfigDirty && !window.confirm('前台显示配置还有未保存内容。继续生成会忽略未保存配置。继续？')) return;
    const data = await request('/api/build', { method: 'POST', body: '{}' });
    renderIssues(data.issues);
    await loadModes();
    showToast('运行题库已生成');
  } catch (error) {
    showToast(error.message);
  }
}

async function exportCurrentMode() {
  if (!state.activeModeId) return;
  if (state.dirty && !window.confirm('当前模式有未保存内容，导出只包含已保存内容。继续导出？')) return;

  try {
    const data = await request(`/api/export/${state.activeModeId}`);
    downloadJson(`love-flight-${state.activeModeId}-${safeDateName()}.json`, data);
    showToast('当前题库包已导出');
  } catch (error) {
    showToast(error.message);
  }
}

async function exportAllModes() {
  if (state.dirty && !window.confirm('当前模式有未保存内容，导出只包含已保存内容。继续导出？')) return;
  if (state.modeConfigDirty && !window.confirm('前台显示配置有未保存内容，导出只包含已保存配置。继续导出？')) return;
  if (state.copyDirty && !window.confirm('前台文案有未保存内容，导出只包含已保存文案。继续导出？')) return;

  try {
    const data = await request('/api/export');
    downloadJson(`love-flight-task-package-${safeDateName()}.json`, data);
    showToast('全部题库包已导出');
  } catch (error) {
    showToast(error.message);
  }
}

async function importPackageFile(file) {
  if (!file) return;
  if ((state.dirty || state.modeConfigDirty || state.copyDirty) && !window.confirm('当前页面有未保存内容，导入会刷新后台数据。继续导入？')) return;

  try {
    const text = await file.text();
    let taskPackage;
    try {
      taskPackage = JSON.parse(text);
    } catch {
      throw new Error('导入文件不是合法 JSON');
    }

    const modeCount = Array.isArray(taskPackage.modes) ? taskPackage.modes.length : 0;
    if (!window.confirm(`准备导入 ${modeCount || '未知数量'} 个项目。相同 ID 的项目和绑定题库会被覆盖，未同名的项目会保留。继续导入？`)) return;

    const data = await request('/api/import', {
      method: 'POST',
      body: JSON.stringify({ package: taskPackage, replace: false }),
    });

    setDirty(false);
    state.modeConfigs = data.modes.map((mode) => ({ ...mode }));
    setModeConfigDirty(false);
    renderModeConfigs();
    await loadAppCopy();
    await loadModes();
    const nextMode = state.modes.some((mode) => mode.id === state.activeModeId)
      ? state.activeModeId
      : state.modes[0]?.id;
    if (nextMode) await loadMode(nextMode);
    await loadSecurity();
    renderIssues(data.built?.issues ?? []);
    showToast(`导入完成：${data.modes.length} 个项目`);
  } catch (error) {
    if (error.data?.issues) renderIssues(error.data.issues);
    showToast(error.message);
  } finally {
    els.importFileInput.value = '';
  }
}

async function downloadBackup(name) {
  try {
    const response = await fetch(`/api/backups/${encodeURIComponent(name)}`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    const data = await response.json();
    downloadJson(name, data);
    showToast('备份已下载');
  } catch (error) {
    showToast(error.message);
  }
}

async function restoreBackup(name) {
  if (!window.confirm(`恢复备份 ${name} 会覆盖当前题库、前台显示和前台文案。恢复前会自动再创建一份当前备份。继续？`)) return;

  try {
    const data = await request(`/api/backups/${encodeURIComponent(name)}/restore`, {
      method: 'POST',
      body: '{}',
    });
    setDirty(false);
    setModeConfigDirty(false);
    setCopyDirty(false);
    await loadAll();
    renderIssues(data.built?.issues ?? []);
    showToast('备份已恢复');
  } catch (error) {
    showToast(error.message);
  }
}

async function loadAll() {
  await loadModes();
  await loadModeConfigs();
  await loadAppCopy();
  await loadSecurity();
  if (state.activeModeId) await loadMode(state.activeModeId);
}

els.taskViewBtn.addEventListener('click', () => setView('tasks'));
els.modeViewBtn.addEventListener('click', async () => {
  setView('modes');
  await loadModeConfigs();
});
els.copyViewBtn.addEventListener('click', async () => {
  setView('copy');
  await loadAppCopy();
});
els.securityViewBtn.addEventListener('click', async () => {
  setView('security');
  await loadSecurity();
});

els.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  els.loginBtn.disabled = true;
  els.authMessage.textContent = '';
  try {
    await login(els.loginPassword.value);
  } catch (error) {
    els.authMessage.textContent = error.message;
  } finally {
    els.loginBtn.disabled = false;
  }
});

els.modeTabs.addEventListener('click', async (event) => {
  const button = event.target.closest('.mode-tab');
  if (!button) return;
  const modeId = button.dataset.modeId;
  if (modeId === state.activeModeId) return;
  if (state.dirty && !window.confirm('当前模式有未保存内容，切换后会丢失。继续切换？')) return;
  await loadMode(modeId);
});

els.taskRows.addEventListener('input', (event) => {
  const textarea = event.target.closest('.task-input, .action-input');
  if (!textarea) return;

  const position = Number(textarea.dataset.position);
  const field = textarea.dataset.field;
  const row = state.rows.find((item) => item.position === position);
  if (!row || (field !== 'm' && field !== 'f' && field !== 'action')) return;

  row[field] = textarea.value;
  setDirty(true);
  refreshRowStatus(position);
  updateCurrentSummary();
});

els.modeConfigRows.addEventListener('input', (event) => {
  const input = event.target.closest('.mode-input, .visible-toggle');
  if (!input) return;
  const mode = state.modeConfigs.find((item) => item.id === input.dataset.modeId);
  if (!mode) return;
  const field = input.dataset.field;
  if (field === 'visible') mode.visible = input.checked;
  else if (field === 'order') mode.order = Number(input.value);
  else if (field === 'name' || field === 'title') mode[field] = input.value;
  setModeConfigDirty(true);
  const tr = input.closest('tr');
  const pill = tr?.querySelector('.state-pill');
  if (pill && field === 'visible') {
    pill.className = `state-pill ${mode.visible ? 'ok' : 'warn'}`;
    pill.textContent = mode.visible ? '展示' : '隐藏';
  }
});

els.copyFields.addEventListener('input', (event) => {
  const input = event.target.closest('.copy-input');
  if (!input) return;
  state.appCopy[input.dataset.field] = input.value;
  setCopyDirty(true);
});

els.backupRows.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const name = button.dataset.name;
  if (button.dataset.action === 'download') await downloadBackup(name);
  if (button.dataset.action === 'restore') await restoreBackup(name);
});

els.searchInput.addEventListener('input', () => {
  state.query = els.searchInput.value;
  renderRows();
});

els.filterSelect.addEventListener('change', () => {
  state.filter = els.filterSelect.value;
  renderRows();
});

els.saveBtn.addEventListener('click', () => saveMode(false));
els.saveBuildBtn.addEventListener('click', () => saveMode(true));
els.checkBtn.addEventListener('click', runCheck);
els.buildBtn.addEventListener('click', runBuild);
els.exportModeBtn.addEventListener('click', exportCurrentMode);
els.clearIssuesBtn.addEventListener('click', () => renderIssues([]));
els.exportAllBtn.addEventListener('click', exportAllModes);
els.importPackageBtn.addEventListener('click', () => els.importFileInput.click());
els.importFileInput.addEventListener('change', () => importPackageFile(els.importFileInput.files[0]));
els.addModeBtn.addEventListener('click', addModeConfig);
els.saveModesBtn.addEventListener('click', saveModeConfigs);
els.saveCopyBtn.addEventListener('click', saveAppCopy);
els.refreshSecurityBtn.addEventListener('click', loadSecurity);
els.logoutBtn.addEventListener('click', logout);
els.passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await changePassword();
});

window.addEventListener('beforeunload', (event) => {
  if (!state.dirty && !state.modeConfigDirty && !state.copyDirty) return;
  event.preventDefault();
  event.returnValue = '';
});

async function init() {
  try {
    const authenticated = await checkAuth();
    if (authenticated) await loadAll();
  } catch (error) {
    setAuthenticated(false);
    showToast(error.message);
  }
}

init();
