# 题库维护说明

题库现在以 Markdown 文件作为人工维护源，位置在：

```text
content/tasks/
  qinglu.md  情侣版
  gaoji.md   高级版
  simi.md    私密版
  sm.md      SM版
  nvpu.md    女仆版
  sizu.md    丝足版
```

程序运行时仍读取生成文件：

```text
static/database.json  现代版读取
```

## 编辑方式

每个模式文件都是表格：

```md
| 格子 | 男生回合任务 m | 女生回合任务 f | 动作 action |
|---:|---|---|---|
| 1 | 男生走到这一格时显示 | 女生走到这一格时显示 | |
```

- `m`：男生回合显示的任务。
- `f`：女生回合显示的任务。
- `action`：可选跳转动作。留空表示不跳转；`move:0` 表示回到起点，`move:12` 表示跳到 12 格，`move:61` 表示直达终点。
- 每个模式必须保留 `1-61` 格。
- 如果任务里需要输入竖线 `|`，写成 `\|`，否则 Markdown 表格会被拆坏。

建议以后所有“回到第几格、直达终点、回到起点”都维护在 `action` 列，不要靠任务文案触发。旧三列表格里包含 `回到起点`、`命运倒流`、`直达终点`、`回到15`、`前进到15` 这类文字时，构建脚本会自动迁移成 `action`；一旦文件变成四列表格，玩家端只认 `action`，任务文案本身不会再触发跳格。

## 常用命令

本地开发时打开题库管理页面：

```bash
npm run tasks:admin
```

也可以直接双击项目根目录的：

```text
start-task-admin.bat
```

默认地址：

```text
http://127.0.0.1:5199/admin/
```

如果要按正式发布方式运行前台和后台，使用同一个 Node 服务端口：

```bash
npm run start:server
```

也可以直接双击项目根目录的：

```text
start-server.bat
```

统一服务默认地址：

```text
玩家前台：http://127.0.0.1:5199/
后台管理：http://127.0.0.1:5199/admin/
后台接口：http://127.0.0.1:5199/api/
运行配置：http://127.0.0.1:5199/static/database.json
```

后台保存题库、前台显示或前台文案后，会更新 `static/*.json`。玩家前台刷新页面时会从同一服务读取最新配置，不需要重新打包前端。

后台现在需要登录。默认情况下，第一次启动会自动生成本地维护密码：

```text
.omx/task-admin-password.txt
```

如果部署在服务器上，并且希望以后能在后台修改密码，推荐使用一次性的初始密码环境变量：

```bash
TASK_ADMIN_INITIAL_PASSWORD=你的初始密码 npm run tasks:admin
```

第一次启动时会把初始密码写入 `.omx/task-admin-password.txt`。之后后台改密码会直接更新这个文件，常驻服务配置不用再改。

后台服务默认只监听 `127.0.0.1`。发布到服务器时，如果前面没有 Nginx/Caddy 反向代理，可以改为监听公网网卡：

```bash
TASK_ADMIN_HOST=0.0.0.0 TASK_ADMIN_INITIAL_PASSWORD=你的初始密码 npm run tasks:admin
```

正式发布时服务会优先读取服务器平台注入的 `PORT` 环境变量，所以 Render、Railway、Fly.io、Heroku 这类随机端口平台通常不用自己写端口：

```bash
TASK_ADMIN_INITIAL_PASSWORD=你的初始密码 npm run start:server
```

如果是自己管理的云服务器，才需要手动指定端口：

```bash
PORT=5199 TASK_ADMIN_HOST=0.0.0.0 TASK_ADMIN_INITIAL_PASSWORD=你的初始密码 npm run start:server
```

`TASK_ADMIN_PASSWORD` 仍然支持，但它代表“密码完全由服务器环境变量管理”。这种模式下后台不能改密码；要改只能改服务器环境变量并重启服务。
如果只想上传新版，不要带旧版遗留文件，先生成发布目录：

```bash
npm run release:modern
```

生成结果在：

```text
release-modern/
```

这个目录只包含新版前台、后台、题库源文件和运行所需 JSON，不包含旧版根目录 `index.html`、`assets/`、`static/game-manager.js`、`static/engine.js`、`static/task-timer.js` 等旧 H5 文件。服务器上上传 `release-modern/` 里的内容即可，进入该目录后启动：

```bash
TASK_ADMIN_INITIAL_PASSWORD=你的初始密码 npm start
```

如果使用 Nginx/Caddy，推荐让反向代理对外提供 HTTPS，再转发到本机实际监听端口。后台虽然有密码登录，但 `/admin/` 最好再加一层 IP 白名单、Basic Auth 或 VPN 访问限制。

后台左侧有四个视图：

- `题库编辑`：维护每个项目的 1-61 格男女双轨任务。
- `前台显示`：控制哪些项目出现在玩家首页、首页名称、页面标题和排序。
- `前台文案`：维护玩家端首页、游戏页、弹窗、按钮、回忆卡等可见文字。
- `安全备份`：修改本地维护密码、查看自动备份、下载备份、恢复备份和最近操作日志。

`前台显示` 里关闭展示后，题库仍会保留在后台，但不会出现在玩家首页。点击“新增项目”会复制当前题库作为新项目的初始内容，默认不在前台展示。

前台文案源文件在：

```text
content/app-copy.json
```

保存后会生成：

```text
static/app-copy.json
```

文案里支持少量占位符：

- `{player}`：当前赢家，例如胜利弹窗和回忆卡赢家字段。

## 安全与备份

所有后台 API 都需要登录后才能访问。登录成功后会写入 HttpOnly 会话 Cookie，默认有效期 12 小时；连续输错会临时限制登录。

`安全备份 -> 修改后台密码` 可以设置临时维护密码。修改时必须输入当前密码和新密码；修改成功后，其它已登录会话会失效。如果服务器使用 `TASK_ADMIN_PASSWORD` 环境变量管理密码，后台页面会禁止修改，必须到服务器平台的环境变量里改。

每次保存题库、保存前台显示、保存前台文案、导入题库包、恢复备份之前，系统都会自动创建一份完整 JSON 备份。备份位置：

```text
.omx/task-admin-backups/
```

操作日志位置：

```text
.omx/task-admin-audit.jsonl
```

`.omx/` 已在 `.gitignore` 中忽略，里面的密码、备份和日志不会进入前端发布包，也不要手动上传到静态站。

恢复备份会覆盖当前 `content/tasks/*.md`、`content/modes.json`、`content/app-copy.json`，恢复前系统会再自动创建一份当前状态备份，方便回退。

## 导入导出

后台支持 JSON 题库包：

- `题库编辑 -> 导出当前`：只导出当前项目和它绑定的题库。
- `前台显示 -> 导出全部`：导出所有后台项目和题库。
- `前台显示 -> 导入包`：导入 JSON 包。同 ID 项目会覆盖，同名题库源文件会覆盖，其它已有项目会保留。

题库包固定格式如下：

```json
{
  "schema": "love-flight-task-package/v1",
  "exportedAt": "2026-04-25T00:00:00.000Z",
  "copy": {
    "documentTitle": "情侣飞行棋",
    "homeTitle": "情侣飞行棋",
    "homeSubtitle": "今晚的回合，由骰子决定"
  },
  "modes": [
    {
      "id": "qinglu",
      "name": "情侣版",
      "title": "情侣版飞行棋",
      "visible": true,
      "order": 1,
      "taskBank": "qinglu",
      "icon": "qinglu",
      "accent": "#c83a2d",
      "soft": "#2b1715",
      "boardBg": "radial-gradient(circle at 50% 0%, #6e1f1c 0%, #241111 42%, #080706 100%)"
    }
  ],
  "tasks": {
    "qinglu": [
      {
        "position": 1,
        "m": "男生回合显示的任务文本",
        "f": "女生回合显示的任务文本",
        "action": {
          "type": "move",
          "target": 12
        }
      }
    ]
  }
}
```

字段约定：

- `schema`：必须是 `love-flight-task-package/v1`。
- `copy`：前台文案配置。导入时如果存在，会同步覆盖 `content/app-copy.json`；完整字段以该文件为准。
- `modes[].id`：项目 ID，只能使用小写字母、数字、`_`、`-`，并以字母开头。
- `modes[].visible`：是否显示在玩家首页。
- `modes[].order`：玩家首页排序，数字越小越靠前。
- `modes[].taskBank`：绑定的题库 ID，对应 `tasks` 里的同名数组，也对应导入后的 `content/tasks/<taskBank>.md`。
- `tasks[taskBank]`：必须包含 `1-61` 共 61 行；`m` 是男生回合任务，`f` 是女生回合任务。
- `tasks[taskBank][].action`：可选结构化动作，目前支持 `{ "type": "move", "target": 12 }`。`target` 范围是 `0-61`，其中 `0` 是起点，`61` 是终点。

后台接口：

```text
GET  /api/export             导出全部题库包
GET  /api/export/<modeId>    导出单个项目题库包
POST /api/import             导入题库包
GET  /api/app-copy           读取前台文案
PUT  /api/app-copy           保存前台文案并生成运行配置
GET  /api/auth/status        登录状态
POST /api/auth/login         登录
POST /api/auth/logout        退出登录
POST /api/auth/password      修改后台密码
GET  /api/backups            备份列表
GET  /api/backups/<name>     下载备份
POST /api/backups/<name>/restore 恢复备份
GET  /api/audit              最近操作日志
```

导入请求体：

```json
{
  "package": {
    "schema": "love-flight-task-package/v1",
    "modes": [],
    "tasks": {}
  },
  "replace": false
}
```

- `replace: false`：合并导入，同 ID 覆盖，其它已有项目保留。后台页面默认使用这个模式。
- `replace: true`：全量替换，只保留导入包里的项目。

检查题库：

```bash
npm run tasks:check
```

从 Markdown 生成程序读取的 JSON/JS：

```bash
npm run tasks:build
```

把导出的总编辑稿导回 `content/tasks/*.md`：

```bash
npm run tasks:import-edit -- "docs/TASK_BANK_EDIT.md"
```

构建现代版时会自动先执行 `tasks:build`：

```bash
npm run build:modern
```

## 当前待处理

除了情侣版之外，其它模式是从旧的单条题库迁移过来的，所以很多行的 `m` 和 `f` 目前相同。`tasks:check` 会把这些行作为 warning 提醒，它们就是后续优先人工拆分的内容。
