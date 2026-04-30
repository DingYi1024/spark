import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseRoot = path.join(repoRoot, 'release-modern');

const requiredStaticFiles = [
  'app-copy.json',
  'database.json',
  'modes.json',
];

function repoPath(...segments) {
  return path.join(repoRoot, ...segments);
}

function releasePath(...segments) {
  return path.join(releaseRoot, ...segments);
}

function ensureInsideRelease(targetPath) {
  const resolved = path.resolve(targetPath);
  const relative = path.relative(releaseRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside release directory: ${resolved}`);
  }
}

function resetReleaseRoot() {
  const resolved = path.resolve(releaseRoot);
  if (path.basename(resolved) !== 'release-modern') {
    throw new Error(`Unexpected release directory: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
  fs.mkdirSync(resolved, { recursive: true });
}

function copyFile(source, target) {
  ensureInsideRelease(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDir(source, target) {
  ensureInsideRelease(target);
  fs.cpSync(source, target, { recursive: true });
}

function writeText(target, text) {
  ensureInsideRelease(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text, 'utf8');
}

function assertExists(target, label) {
  if (!fs.existsSync(target)) {
    throw new Error(`${label} not found: ${target}`);
  }
}

resetReleaseRoot();

assertExists(repoPath('dist-modern', 'index.html'), 'Modern build output');
copyDir(repoPath('dist-modern'), releasePath('dist-modern'));
copyDir(repoPath('content'), releasePath('content'));
copyDir(repoPath('tools', 'task-admin'), releasePath('tools', 'task-admin'));

copyFile(repoPath('scripts', 'task-bank.mjs'), releasePath('scripts', 'task-bank.mjs'));
copyFile(repoPath('scripts', 'tasks-admin-server.mjs'), releasePath('scripts', 'tasks-admin-server.mjs'));

for (const fileName of requiredStaticFiles) {
  copyFile(repoPath('static', fileName), releasePath('static', fileName));
}

writeText(
  releasePath('package.json'),
  `${JSON.stringify(
    {
      name: 'love-flight-modern-release',
      private: true,
      version: '1.0.0',
      scripts: {
        start: 'node scripts/tasks-admin-server.mjs',
        serve: 'node scripts/tasks-admin-server.mjs',
      },
      engines: {
        node: '>=18',
      },
    },
    null,
    2,
  )}\n`,
);

writeText(
  releasePath('.gitignore'),
  `.omx/\nnode_modules/\nnpm-debug.log*\n`,
);

writeText(
  releasePath('README_DEPLOY.md'),
  `# 情侣飞行棋新版发布包

这个目录只包含新版运行所需文件，不包含旧版 H5 打包产物。

## 启动

多数服务器平台会自动注入 \`PORT\`，直接这样启动即可：

\`\`\`bash
TASK_ADMIN_PASSWORD=你的强密码 npm start
\`\`\`

如果是自己管理的云服务器，也可以手动指定端口：

\`\`\`bash
PORT=5199 TASK_ADMIN_HOST=0.0.0.0 TASK_ADMIN_PASSWORD=你的强密码 npm start
\`\`\`

## 访问

- 玩家前台：\`http://服务器域名或平台分配地址/\`
- 后台管理：\`http://服务器域名或平台分配地址/admin/\`

## 目录说明

- \`dist-modern/\`：新版玩家前台。
- \`tools/task-admin/\`：后台管理页面。
- \`scripts/\`：统一 Node 服务和题库生成逻辑。
- \`content/\`：可维护题库、前台显示、前台文案源文件。
- \`static/*.json\`：玩家端运行时读取的配置。
- \`.omx/\`：服务器运行后自动生成，保存后台密码、备份和操作日志，不要公开上传。
`,
);

const legacyNames = [
  'assets',
  'index.html',
  'static/database.js',
  'static/engine.js',
  'static/game-enhancer.js',
  'static/game-manager.js',
  'static/review-card.js',
  'static/styles.css',
  'static/task-timer.js',
];

for (const legacyName of legacyNames) {
  if (fs.existsSync(releasePath(legacyName))) {
    throw new Error(`Legacy file was copied into release package: ${legacyName}`);
  }
}

const files = [];
function collectFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(fullPath);
    else files.push(fullPath);
  }
}
collectFiles(releaseRoot);
const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);

console.log(`Modern release generated: ${releaseRoot}`);
console.log(`Files: ${files.length}, size: ${(totalBytes / 1024).toFixed(1)} KB`);
