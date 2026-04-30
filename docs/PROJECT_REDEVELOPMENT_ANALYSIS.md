# 情侣飞行棋项目解析与无感重做方案

审计时间：2026-04-24  
工作目录：`D:\CodeX\love`

## 1. 核心结论

这个项目不是一个完整的源码工程，而是一个已经打包过的 uni-app/Vue H5 产物，再叠加若干 `static/*.js` 后置增强脚本。

现有页面真正入口是：

1. `index.html`
2. `static/database.js`
3. `static/game-manager.js`
4. `static/game-enhancer.js`
5. `static/task-timer.js`
6. `static/review-card.js`
7. `assets/index-CxB9sa9_.js`
8. `assets/*.css`

维护困难的根因不是某一行写得差，而是工程形态错误：业务逻辑在压缩、混淆、Unicode 转义后的 `assets/*.js` 中，增强功能靠 DOM 扫描、Proxy、全局变量和运行时补丁接在外层。

我已修复一个实际阻塞运行的语法错误：`static/game-manager.js` 原来在浏览器报 `Unexpected token '='`，导致该增强脚本整文件失败。修复后本地 Playwright 截图脚本验证通过，`consoleErrors=[]`、`pageErrors=[]`。

## 2. 现有 UI 与功能快照

当前用户可见 UI：

- 首屏：粉色主题、标题“情侣飞行棋”、六个模式卡片：情侣版、高级版、私密版、SM版、女仆版、丝足版。
- 游戏页：顶部导航栏、模式切换胶囊按钮、8x8 棋盘、骰子、当前回合、重新开始、返回主页。
- 进入模式后有 18+ / 已知悉弹窗。
- 右下角有背景音乐开关浮层。

当前功能：

- 模式选择与路由跳转。
- 棋盘初始化。
- 男女双方轮流掷骰。
- 按格子触发任务弹窗。
- 特殊格：回到起点、回到指定格、前进/直达等。
- 背景音乐、点击音效、震动。
- 任务倒计时识别。
- 游戏结束海报生成。

## 3. 文件职责地图

### `index.html`，1-29 行

- 1-2：标准 HTML5，语言为中文。
- 4：加载 uni-app 基础样式。
- 5-10：SEO 与社交分享描述。
- 14-19：加载后置增强脚本。这里是当前项目的“补丁层”。
- 21：页面标题。
- 23：加载真正的 uni-app/Vue 打包入口。
- 24：加载打包主样式。
- 27：Vue/uni-app 挂载点。

关键风险：增强脚本在主 bundle 前加载，其中 `game-manager.js` 会代理 `window.GAME_DATABASE`，这依赖 `database.js` 必须先成功执行。

### `assets/*.js` 打包产物

这些文件是旧项目核心，但不是可维护源码：

- `assets/index-CxB9sa9_.js`：uni-app/Vue runtime、路由表、应用启动逻辑。
- `assets/pages-index-index.*.js`：首页模式选择页。
- `assets/pages-game-qinglu.*.js`：情侣版棋盘页。
- `assets/pages-game-gaoji.*.js`：高级版棋盘页。
- `assets/pages-game-simi.*.js`：私密版棋盘页。
- `assets/pages-game-sm.*.js`：SM版棋盘页。
- `assets/pages-game-nvpu.*.js`：女仆版棋盘页。
- `assets/pages-game-sizu.*.js`：丝足版棋盘页。
- `assets/pages-game-*_rules.*.js`：各模式玩法说明页。
- `assets/Dice3D.*.js`：3D 骰子组件。
- `assets/ad-popup.*.js`：广告弹窗组件。

关键风险：所有页面逻辑都在一行内压缩，并混合 Unicode 转义、字符串反转、异或常量，几乎不能做可靠逐行维护。真正应该做的是按现有 UI 反向建模，再用新源码重建。

### `static/database.js` / `static/database.json`

职责：维护六个模式的题库数据。

数据结构：

```js
{
  qinglu: {
    "1": { m: "...", f: "..." },
    "2": { m: "...", f: "..." }
  },
  gaoji: {
    "1": "...",
    "2": "..."
  }
}
```

其中 `qinglu` 是双轨题库，按男/女当前回合取 `m` 或 `f`；其它模式多数是单字符串题库。

维护建议：

- 保留 JSON 作为内容源。
- 用 TypeScript 类型和 JSON Schema 校验数据。
- 题库文本不要进入代码 bundle，避免每次改文案都重新构建。
- 成人内容必须继续保留 18+ 提示，并避免采集、上传或默认保存用户私密内容。

### `static/game-manager.js`，1-450 行

这是当前最重要的运行时补丁脚本。

- 1-9：文件说明，表示移除了旧的深色入口主页和强制题库代理。
- 12-25：把 `window.GAME_DATABASE` 包成 Proxy。目的：让打包页面读取题库时仍拿到外部题库。
- 28：等待 DOMContentLoaded 后执行 UI 注入。
- 30-126：注入恢复弹窗 CSS。
- 130-204：构造恢复弹窗和胜利页 DOM。
- 205-231：`createParticles()`，创建游戏结束粒子动画。
- 233-266：`showVictoryPage()`，显示胜利遮罩、清理本地进度、绑定海报按钮。
- 269-407：`injectSkipButton()`，识别任务弹窗，修复双轨题库显示，注入“协商换一个”按钮。
- 410-435：MutationObserver 观察 DOM，检测胜利文案和任务弹窗。
- 438-449：延迟检查恢复进度并启动观察。

已修复问题：

- 原 405 行附近有残缺的 `} = 'scale(1)'` 和重复代码块，导致整文件语法错误。
- 修复方式：补上 `showVictoryPage()` 的结束括号，删除重复残片。

剩余风险：

- 恢复进度只弹 `alert`，没有真正把棋子恢复到 UI。
- 胜利页统计用随机 fallback，不一定是真实掷骰次数。
- “协商换一个”依赖 DOM 类名和文本判断，打包结构一变就会失效。
- `__love_selected_db` 目前没有稳定写入链路，非情侣模式换任务可能取错题库。

### `static/game-enhancer.js`，1-332 行

职责：音效、震动、背景音乐按钮。

- 1-9：说明 V2 改动。
- 14-20：创建全局唯一 `AudioContext`。
- 23-24：主音量节点。
- 26-28：恢复浏览器挂起的音频上下文。
- 35-67：`synthNote()`，用多个 oscillator 模拟钢琴音符。
- 69-106：`playSynth()`，根据点击、骰子、弹窗播放不同音效。
- 108-110：移动端震动封装。
- 115-126：监听全局点击，给按钮/uni-view 加音效和震动。
- 129-146：观察骰子样式变化，触发骰子滚动音效。
- 155-180：定义 BGM 和弦与旋律。
- 190-230：分块调度 BGM。
- 232-245：启动/停止 BGM。
- 250-331：创建右下角音乐按钮和点击切换逻辑。

风险：

- 背景音乐用 Web Audio 实时合成，兼容性尚可，但没有统一的音量设置持久化。
- 全局监听 `.uni-view` 范围过大，可能让普通区域点击也触发音效。

### `static/task-timer.js`，1-242 行

职责：自动识别任务弹窗内的时间，并显示倒计时。

- 1：DOMContentLoaded 后执行。
- 3-43：注入倒计时浮层 CSS。
- 46-60：注入倒计时 DOM。
- 62-70：缓存 DOM 节点。
- 72-75：倒计时状态变量。
- 78-115：`beep()`，复用全局 AudioContext 播放提示音。
- 118-121：格式化秒数。
- 123-130：更新显示。
- 132-154：开始倒计时。
- 156-164：暂停/继续。
- 166-174：重置。
- 176-179：关闭。
- 181-185：绑定按钮事件。
- 188-238：MutationObserver 识别弹窗文本中的“30秒 / 1分钟 / 半分钟”等时间。

风险：

- 中文数字只支持一到十的简单格式。
- 只监听新增节点，不保证弹窗后续文本变化也能被识别。
- 同一页面多次弹窗时没有任务 ID，可能误触发。

### `static/review-card.js`，1-115 行

职责：游戏结束生成回顾海报。

- 1-5：说明用途。
- 7-11：动态加载 `node_modules/html2canvas/dist/html2canvas.min.js`。
- 14-50：创建隐藏海报 DOM 模板。
- 53-77：暴露 `window.generateReviewCard()`，填数据并转 canvas。
- 79-114：暴露 `window.showReviewModal()`，展示生成图片。

风险：

- 浏览器路径直接指向 `node_modules`，部署时如果不带 `node_modules` 会失败。
- 海报模板是内联样式，不利于维护。
- 胜利统计来源不稳定。

### `static/engine.js`，1-382 行

这是一个“Vanilla Edition”重写尝试，但当前 `index.html` 没有加载它。

- 7-27：读取页面所需 DOM。
- 30-46：维护游戏状态。
- 52-100：菜单选择、返回、重开。
- 102-105：视图切换。
- 109-123：开始游戏并重置状态。
- 128-165：用 5 列 S 形路线生成棋盘。
- 170-183：更新当前回合 UI。
- 188-222：移动棋子并滚动到可见区域。
- 226-263：掷骰动画与点数生成。
- 265-289：处理玩家移动和胜负判断。
- 292-338：触发任务弹窗，并识别特殊行动。
- 340-345：任务文本视觉高亮。
- 348-380：游戏结束弹窗与海报按钮。

判断：它是可维护方向的雏形，但 UI 和当前打包页面不一致，不能直接替换线上版本。

### `static/styles.css`，1-326 行

职责：配合 `static/engine.js` 的 Vanilla UI，不服务当前 uni-app 打包页面。

主要结构：

- 1-18：CSS 变量。
- 20-34：全局 reset。
- 36-52：视图切换。
- 54-95：首页菜单。
- 97-199：游戏页、棋盘、棋子。
- 201-241：3D 骰子。
- 244-326：任务弹窗。

判断：这是重做方向的样式参考，但不是当前用户看到的样式源。

### 根目录 Node 脚本

`extract-db.js`，1-56 行：

- 从打包页面里提取题库，生成 `static/database.js`。
- 风险：正则只适配简单对象，遇到双轨对象、压缩变化、转义变化会失效。

`build-opt.js`，1-46 行：

- 批量替换远程图片、绝对路径。
- 风险：硬编码 `d:/opencode/love`，在当前目录 `D:\CodeX\love` 下不可复用。

`replacer.js`，1-80 行：

- 替换旧公众号/QQ 文案。
- 风险：同样硬编码旧路径，且直接改打包产物。

`revert_assets.js`：

- 撤销题库外提补丁。
- 风险：正则贪婪匹配打包 JS，容易误伤。

`promo-capture.cjs`，1-106 行：

- 启动本地静态服务器，用 Playwright 捕获首页、年龄提示、棋盘三张截图。
- 当前 `package.json` 未声明 Playwright，所以直接 `node promo-capture.cjs` 会失败；使用工作区内置 Playwright 可运行。

`start.bat`：

- 尝试用 Python 或 Node 启动本地 HTTP 服务并打开页面。

## 4. 当前最主要维护风险

1. 没有原始源码。
2. 核心逻辑在压缩混淆后的打包产物中。
3. 后置增强脚本依赖 DOM 结构和文本内容，脆弱。
4. 构建、测试、截图依赖没有写入 `package.json`。
5. 多个脚本硬编码旧路径 `d:/opencode/love`。
6. `review-card.js` 部署依赖 `node_modules` 静态可访问。
7. 成人内容产品缺少清晰的合规边界、内容分级与隐私说明。
8. 没有视觉回归基线，无法证明“用户感知不到重做”。

## 5. 结合当前前端趋势的重做方向

已核验的官方趋势依据：

- Vite 官方文档把 Vite 定义为现代 Web 项目的快速、轻量构建工具，提供 dev server、HMR 和生产构建，并支持 Vue/TypeScript 模板：https://vite.dev/guide/
- Vue 官方文档说明 Vue 自身使用 TypeScript，官方脚手架 `create-vue` 支持 Vite 驱动、TypeScript-ready 项目：https://vuejs.org/guide/typescript/overview
- Vitest 官方文档定位为 Vite-native 测试框架，可复用 Vite 配置与转换链路：https://vitest.dev/
- Playwright 官方支持截图视觉对比，可用于保证重做前后 UI 一致：https://playwright.dev/docs/test-snapshots

推荐路线：

1. 如果只做 H5 网页：用 Vue 3 + Vite + TypeScript 重建。
2. 如果还要小程序/App 多端：保留 uni-app，但必须恢复源码工程，而不是继续维护 `assets/*.js`。
3. 游戏规则、棋盘移动、特殊格、倒计时识别、海报生成全部拆成纯函数和模块。
4. CSS 先复刻现有页面 class、尺寸、颜色、圆角、间距，再逐步转成设计 token。
5. 用 Playwright 保存旧版三类关键截图：首页、年龄弹窗、棋盘页；重做后做像素级对比。
6. 用 Vitest 测规则：掷骰范围、男女回合切换、特殊格跳转、任务选择、倒计时解析。

## 6. 无感重做实施计划

### 阶段 A：冻结现状

- 保存当前截图为 golden baseline。
- 记录当前路由：`/pages/index/index`、`/pages/game/qinglu` 等。
- 固化题库 JSON。
- 把当前线上包保留为 `legacy/` 或 `public/legacy/`。

### 阶段 B：建立新源码骨架

建议目录：

```text
src/
  app/
  components/
    ModeCard.vue
    GameBoard.vue
    Dice3D.vue
    AgeGateModal.vue
    TaskModal.vue
    TaskTimer.vue
    ReviewCard.vue
    BgmToggle.vue
  data/
    tasks.json
    modes.ts
  game/
    engine.ts
    special-cells.ts
    timer-parser.ts
    persistence.ts
  styles/
    tokens.css
    legacy-match.css
tests/
  unit/
  e2e/
```

### 阶段 C：先复刻，不优化体验

必须保持不变：

- 文案不变。
- 颜色不变。
- 模式数量和顺序不变。
- 棋盘格数、特殊格位置、骰子行为不变。
- 18+ 弹窗位置、按钮、规则入口不变。
- 路由不变，避免旧分享链接失效。

### 阶段 D：替换运行入口

- 新项目构建产物输出到 `dist/`。
- 用 `index.html` 指向新 bundle。
- 保留 `static/` 资源路径，避免部署路径变化。
- 旧包短期保留为回滚点。

### 阶段 E：验收门槛

上线前至少满足：

- 首页截图 diff 在可接受阈值内。
- 年龄弹窗截图 diff 在可接受阈值内。
- 六个模式棋盘截图 diff 在可接受阈值内。
- 30 次随机掷骰 E2E 不报错。
- 特殊格跳转测试通过。
- 海报生成测试通过。
- 移动端 390x844、430x932、iPhone safe-area 三类视口通过。

## 7. 下一步建议

下一步不建议继续修补打包文件。正确顺序是：

1. 把视觉基线和现有行为基线补齐。
2. 新建 Vite/Vue/TypeScript 源码工程。
3. 先实现游戏内核和数据校验。
4. 再实现完全复刻的 UI。
5. 最后切换入口并保留旧版回滚。

