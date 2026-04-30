/**
 * engine.js for Vanilla Edition
 * 核心游戏逻辑：棋盘生成、骰子逻辑、移动系统和结局验证。
 * 不依赖任何外部框架。
 */

document.addEventListener('DOMContentLoaded', () => {

    /* --- DOM Elements --- */
    const views = {
        menu: document.getElementById('menu-view'),
        game: document.getElementById('game-view')
    };

    const boardEl = document.getElementById('board');
    const p0El = document.getElementById('player-0');
    const p1El = document.getElementById('player-1');
    const turnText = document.getElementById('turn-text');
    const titleText = document.getElementById('current-mode-title');

    const btnRoll = document.getElementById('btn-roll');
    const diceEl = document.getElementById('dice');
    
    const modal = document.getElementById('task-modal');
    const taskTitle = document.getElementById('task-title');
    const taskDesc = document.getElementById('task-desc');
    const btnConfirm = document.getElementById('btn-confirm-task');

    /* --- Game State --- */
    let GAME_MODE = 'qinglu';
    let BANK = null;
    let TOTAL_CELLS = 60; // 默认格子数

    let p0_pos = 1; // 男方位置
    let p1_pos = 1; // 女方位置
    let current_turn = 0; // 0: 男方, 1: 女方
    let isRolling = false;

    // 格子坐标缓存 [{x, y}, ... ] 1-indexed (index 0 is null)
    let cellCoords = [];
    
    // 游戏回顾数据统计
    let stats = {
        turnsData: 0,
        tasksTriggered: 0
    };

    // 初始化
    initMenu();

    // =============== Menu Handling ===============
    function initMenu() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                GAME_MODE = btn.getAttribute('data-mode');
                titleText.innerText = btn.innerText;
                
                // Set bank
                if (GAME_MODE === 'custom') {
                    try {
                        const saved = localStorage.getItem('__love_custom_db');
                        if (!saved) throw new Error();
                        const parsed = JSON.parse(saved);
                        if (!parsed.tasks || parsed.tasks.length === 0) throw new Error();
                        
                        // 转换数组为 {1: {m, f}, 2: {m, f}} 格式给引擎用
                        BANK = {};
                        parsed.tasks.forEach((item, idx) => {
                            BANK[idx + 1] = item;
                        });
                        TOTAL_CELLS = parsed.tasks.length;
                    } catch(e) {
                         alert("未检测到有效的自定义题库！请先点击菜单下方【✍️ 创作专属题库】进行添加。");
                         return;
                    }
                } else if (window.GAME_DATABASE && window.GAME_DATABASE[GAME_MODE]) {
                    BANK = window.GAME_DATABASE[GAME_MODE];
                    TOTAL_CELLS = Math.max(Object.keys(BANK).length, 60); 
                } else {
                    alert("题库未加载或缺少选定的模式！");
                    return;
                }

                switchView('game');
                startGame();
            });
        });

        document.getElementById('btn-back').addEventListener('click', () => {
            if(confirm("确定要返回主菜单吗？未完成进度将丢失。")) {
                switchView('menu');
            }
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
             if(confirm("确定要重新开始当前模式吗？")) {
                startGame();
            }
        });
    }

    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    }

    // =============== Game Engine ===============

    function startGame() {
        p0_pos = 1;
        p1_pos = 1;
        current_turn = 0; // 0 for Player 1 (Male/Blue), 1 for Player 2 (Female/Pink)
        isRolling = false;
        
        // reset stats
        stats.turnsData = 0;
        stats.tasksTriggered = 0;
        
        generateBoard();
        updateTurnUI();
        movePlayer(0, p0_pos, true);
        movePlayer(1, p1_pos, true);
    }

    /**
     * S形流水线生成棋盘
     */
    function generateBoard() {
        boardEl.innerHTML = '';
        cellCoords = [null]; // 1-based indexing

        const cols = 5; 
        const cellGap = 16;   // vm (viewport units) roughly
        const cellSize = 14; 

        // 动态计算 Board 容器高度
        const rows = Math.ceil(TOTAL_CELLS / cols);
        boardEl.style.height = (rows * cellGap + 10) + 'vw';

        for (let i = 1; i <= TOTAL_CELLS; i++) {
            const row = Math.floor((i - 1) / cols);
            const col = (i - 1) % cols;
            
            // S 形反转
            const actualCol = (row % 2 === 0) ? col : (cols - 1 - col);
            
            const x = actualCol * cellGap + 5; // 5vw padding left
            const y = row * cellGap + 5;       // 5vw padding top

            cellCoords[i] = { x, y };

            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${i}`;
            if (i === 1) cell.classList.add('start');
            if (i === TOTAL_CELLS) cell.classList.add('end');
            
            cell.innerText = (i === 1) ? '起' : (i === TOTAL_CELLS) ? '终' : i;
            
            cell.style.left = `${x}vw`;
            cell.style.top = `${y}vw`;
            
            boardEl.appendChild(cell);
        }
    }

    /**
     * 更新 UI 提示文本
     */
    function updateTurnUI() {
        p0El.classList.remove('active-pawn');
        p1El.classList.remove('active-pawn');

        if (current_turn === 0) {
            turnText.innerText = "男方回合 ♂";
            turnText.className = "player-p1";
            p0El.classList.add('active-pawn');
        } else {
            turnText.innerText = "女方回合 ♀";
            turnText.className = "player-p2";
            p1El.classList.add('active-pawn');
        }
    }

    /**
     * 移动棋子到指定格
     */
    function movePlayer(playerIdx, targetPos, instant = false) {
        if (targetPos > TOTAL_CELLS) targetPos = TOTAL_CELLS;
        if (targetPos < 1) targetPos = 1;
        
        const pawn = playerIdx === 0 ? p0El : p1El;
        const coords = cellCoords[targetPos];
        
        if (!coords) return targetPos;

        // 稍微偏移防止两颗棋子完全重叠
        const offsetX = playerIdx === 0 ? -2 : 2;
        const offsetY = playerIdx === 0 ? -2 : 2;

        if (instant) {
            pawn.style.transition = 'none';
        } else {
            pawn.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
        
        pawn.style.left = `calc(${coords.x}vw + ${offsetX}px)`;
        pawn.style.top = `calc(${coords.y}vw + ${offsetY}px)`;
        
        // 当不是瞬间移动时，尝试自动轻度滚动使棋子居中可见
        if (!instant) {
            setTimeout(() => {
                const pawnRect = pawn.getBoundingClientRect();
                const containerRect = document.querySelector('.board-frame').getBoundingClientRect();
                if (pawnRect.bottom > containerRect.bottom || pawnRect.top < containerRect.top) {
                   pawn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }

        return targetPos;
    }

    // =============== Dice & Action ===============

    btnRoll.addEventListener('click', () => {
        if (isRolling) return;
        isRolling = true;
        
        // 1. Roll Animation
        diceEl.classList.add('rolling');
        
        // (可选) 调用 enhancer 音效
        if (window.__loveAudioCtx) {
            try { 
                 const e = new Event('click', { bubbles: true }); 
                //  document.body.dispatchEvent(e);
            } catch(e){}
        }

        setTimeout(() => {
            diceEl.classList.remove('rolling');
            
            // 2. Generate Number
            const steps = Math.floor(Math.random() * 6) + 1;
            
            // Update CSS for specific face (Hackish way to show result quickly by rotating parent)
            switch(steps) {
                case 1: diceEl.style.transform = 'rotateX(0deg) rotateY(0deg)'; break;
                case 6: diceEl.style.transform = 'rotateY(180deg)'; break;
                case 3: diceEl.style.transform = 'rotateY(-90deg)'; break;
                case 4: diceEl.style.transform = 'rotateY(90deg)'; break;
                case 2: diceEl.style.transform = 'rotateX(-90deg)'; break;
                case 5: diceEl.style.transform = 'rotateX(90deg)'; break;
            }

            // 3. Move Player logic
            setTimeout(() => {
                handleTurn(steps);
            }, 500);

        }, 800);
    });

    function handleTurn(steps) {
        stats.turnsData++; // 增加掷骰次数
        let currentPos = current_turn === 0 ? p0_pos : p1_pos;
        let newPos = currentPos + steps;
        
        // Update State & UI
        if (current_turn === 0) {
            p0_pos = movePlayer(0, newPos);
            currentPos = p0_pos;
        } else {
            p1_pos = movePlayer(1, newPos);
            currentPos = p1_pos;
        }

        setTimeout(() => {
            // Check Victory
            if (currentPos >= TOTAL_CELLS) {
               showVictory();
               return;
            }

            // Trigger Task
            triggerTask(currentPos);
        }, 500);
    }

    // =============== Task Modal ===============
    function triggerTask(pos) {
        stats.tasksTriggered++; // 记录触发的任务次数
        
        let taskData = BANK[pos];
        let taskText = "神秘格子，两人喝交杯酒 🥂";
        
        if (taskData) {
            // 如果是双轨题库格式 { m: "男任务", f: "女任务" }
            if (typeof taskData === 'object' && taskData.m && taskData.f) {
                taskText = (current_turn === 0) ? taskData.m : taskData.f;
            } else {
                taskText = taskData.toString();
            }
        }

        // Handle specific logic like "回到起点" / "退回xx"
        let specialAction = null;
        if (taskText.includes('回到起点') || taskText.includes('命运倒流')) {
             specialAction = () => {
                 if(current_turn === 0) p0_pos = movePlayer(0, 1);
                 else p1_pos = movePlayer(1, 1);
             };
        } else if (taskText.match(/回到(\d+)/)) {
             const m = taskText.match(/回到(\d+)/);
             specialAction = () => {
                 const tPos = parseInt(m[1]);
                 if(current_turn === 0) p0_pos = movePlayer(0, tPos);
                 else p1_pos = movePlayer(1, tPos);
             }
        }

        // Show Modal
        taskTitle.innerText = `第 ${pos} 格任务`;
        taskDesc.innerHTML = parseTaskEmoji(taskText);
        
        modal.classList.remove('hidden');

        btnConfirm.onclick = () => {
            modal.classList.add('hidden');
            if (specialAction) specialAction();
            
            // Switch turn
            current_turn = current_turn === 0 ? 1 : 0;
            updateTurnUI();
            isRolling = false;
        };
    }

    function parseTaskEmoji(text) {
        // Quick visual polish for specific words matching 
        text = text.replace(/【.+?】/g, match => `<strong style="color:var(--primary)">${match}</strong><br>`);
        text = text.replace(/(\d+秒|1分钟|半分钟|一分钟)/g, match => `<span style="background:#fef0f6; border:1px solid #fbcfe8; border-radius:4px; padding:0 4px; color:#be185d;">⏳ ${match}</span>`);
        return text;
    }

    // =============== End Game ===============
    function showVictory() {
        const winner = current_turn === 0 ? "男生 ♂" : "女生 ♀";
        
        const endPopup = document.createElement('div');
        endPopup.className = 'modal-mask hidden';
        endPopup.innerHTML = `
            <div class="modal-content" style="padding-bottom:15px;">
                <h2 class="modal-title" style="font-size:2rem; color:#f472b6;">🎉 游戏结束</h2>
                <p class="modal-text" style="font-weight:bold;">🏆 恭喜 ${winner} 到达终点！</p>
                <div style="font-size:0.9rem; color:#64748b; margin-bottom:20px; line-height:1.6;">
                    共投掷骰子 <strong>${stats.turnsData}</strong> 次<br>
                    执行了 <strong>${stats.tasksTriggered}</strong> 个双轨任务
                </div>
                <div class="modal-actions">
                    <button class="btn primary" id="btn-share-card">📸 生成心跳回忆卡片</button>
                    <button class="btn secondary" onclick="location.reload()">再来一局</button>
                </div>
            </div>
        `;
        document.body.appendChild(endPopup);
        setTimeout(() => { endPopup.classList.remove('hidden'); }, 10);
        
        document.getElementById('btn-share-card').onclick = async () => {
            document.getElementById('btn-share-card').innerText = "生成中...";
            if (window.generateReviewCard) {
                const b64 = await window.generateReviewCard(winner, stats.turnsData, stats.tasksTriggered);
                if (b64 && window.showReviewModal) {
                    window.showReviewModal(b64);
                }
            }
            document.getElementById('btn-share-card').innerText = "📸 生成心跳回忆卡片";
        }
    }

});
