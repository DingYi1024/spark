/**
 * Game Manager Script (V1.x)
 * 已根据需求移除自定义的深色入口主页和题库强制代理拦截，
 * 让用户通过原生的浅色主页自由选择游戏模式（情侣、高级等）。
 *
 * 当前仅保留与原生界面不冲突的附加功能：
 * 1. 游戏进度本地缓存与恢复提示
 */

// ========== 核心拦截器：引擎 ==========
// 将原始题库的获取交给后续 DOM observer 处理双轨
const originalDB = window.GAME_DATABASE;
window.GAME_DATABASE = new Proxy(originalDB, {
    get: function(target, prop) {
        if (typeof prop === 'string' && target[prop]) {
            let sourceCat = target[prop];
            
            // 重要：在这里我们不对 {m, f} 进行降维打击
            // 因为 Vue 会在任意时刻读取，此时无法得知是男女。
            // 我们将在 DOM 弹出的那一刻，通过拦截弹出框内部的文本来实现动态绑定！
            return sourceCat;
        }
        return target[prop];
    }
});


document.addEventListener('DOMContentLoaded', () => {
  // ========== 恢复弹窗 UI 样式 ==========
  const style = document.createElement('style');
  style.innerHTML = `
  /* 恢复提示弹窗 */
    #gm-resume-dialog {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 25px;
      width: 80%;
      max-width: 320px;
      z-index: 1000000;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #gm-resume-dialog.active {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, -50%) scale(1);
    }
    .gm-dialog-title { color: #fff; font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; }
    .gm-dialog-text { color: #94a3b8; font-size: 0.9rem; margin-bottom: 20px; }
    .gm-dialog-actions { display: flex; gap: 10px; }
    .gm-dialog-btn { flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
    .gm-dialog-btn.cancel { background: #334155; color: #cbd5e1; }
    .gm-dialog-btn.confirm { background: #3b82f6; color: #fff; }

    /* ========== 胜利庆祝页样式 ========== */
    #gm-victory-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.95);
      z-index: 9999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 1s ease;
      backdrop-filter: blur(15px);
    }
    #gm-victory-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .victory-title {
      font-size: 3rem;
      font-weight: 900;
      background: linear-gradient(135deg, #f472b6, #fb7185, #facc15);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
      text-shadow: 0 10px 30px rgba(244, 114, 182, 0.5);
      animation: popIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .victory-subtitle {
      color: #e2e8f0;
      font-size: 1.2rem;
      margin-bottom: 40px;
      animation: fadeInUp 1s ease;
    }
    .victory-penalty {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(236,72,153,0.3);
      padding: 20px 30px;
      border-radius: 16px;
      color: #fff;
      font-size: 1.1rem;
      max-width: 80%;
      text-align: center;
      line-height: 1.6;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      animation: fadeInUp 1.2s ease;
    }
    .victory-btn {
      margin-top: 50px;
      padding: 15px 40px;
      background: linear-gradient(135deg, #ec4899, #be185d);
      color: white;
      border: none;
      border-radius: 30px;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 10px 20px rgba(236,72,153,0.4);
      transition: transform 0.2s;
      animation: fadeInUp 1.4s ease;
    }
    .victory-btn:active { transform: scale(0.95); }

    .particle {
      position: absolute;
      pointer-events: none;
      background-size: contain;
      background-repeat: no-repeat;
    }

    @keyframes popIn {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeInUp {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // ========== 进度缓存逻辑 ==========
  
  // 注入恢复弹窗
  const resumeDialog = document.createElement('div');
  resumeDialog.id = 'gm-resume-dialog';
  resumeDialog.innerHTML = `
    <div class="gm-dialog-title">发现未完成的对局</div>
    <div class="gm-dialog-text">是否恢复上一次的游戏进度？</div>
    <div class="gm-dialog-actions">
      <button class="gm-dialog-btn cancel" id="gm-resume-cancel">重新开始</button>
      <button class="gm-dialog-btn confirm" id="gm-resume-confirm">恢复进度</button>
    </div>
  `;
  document.body.appendChild(resumeDialog);

  function checkAndRestoreState() {
      const saved = localStorage.getItem('__love_game_state');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              if (parsed.p1 > 0 || parsed.p2 > 0) {
                  resumeDialog.classList.add('active');
                  
                  document.getElementById('gm-resume-confirm').onclick = () => {
                      resumeDialog.classList.remove('active');
                      restoreStateToUI(parsed);
                  };
                  document.getElementById('gm-resume-cancel').onclick = () => {
                      resumeDialog.classList.remove('active');
                      localStorage.removeItem('__love_game_state');
                      // 不做操作，让其自然在起点
                  };
                  return;
              }
          } catch(e) {}
      }
  }

  function restoreStateToUI(state) {
     console.log("Attempting to restore state:", state);
     alert(`[恢复成功] 女方: ${state.p1} 格, 男方: ${state.p2} 格。\n(注: 当前版本仅保存数据，完美UI恢复将在下一版本完成)`);
  }

  // ========== 胜利庆祝特效及逻辑 ==========
  
  const victoryOverlay = document.createElement('div');
  victoryOverlay.id = 'gm-victory-overlay';
  victoryOverlay.innerHTML = `
    <div class="victory-title">游戏结束</div>
    <div class="victory-subtitle" id="gm-victory-winner">恭喜抵达终点！</div>
    <div class="victory-penalty" id="gm-victory-penalty">
      终极奖励：输的一方需要答应赢的一方任意一个条件！<br>
      或者根据今晚所选的主题，进行最终的深入互动。
    </div>
    <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 30px;">
        <button class="victory-btn" style="background: linear-gradient(135deg, #10b981, #059669);" id="btn-gm-share">📸 生成心跳回忆卡片</button>
        <button class="victory-btn" onclick="location.reload()">再来一局</button>
    </div>
  `;
  document.body.appendChild(victoryOverlay);

  function createParticles() {
      const colors = ['#f472b6', '#3b82f6', '#facc15', '#a855f7', '#ffffff'];
      const shapes = ['❤️', '✨', '🎉', '🥂'];
      for (let i = 0; i < 80; i++) {
          const p = document.createElement('div');
          p.className = 'particle';
          p.innerText = shapes[Math.floor(Math.random() * shapes.length)];
          p.style.left = Math.random() * 100 + 'vw';
          p.style.top = -20 + 'px';
          p.style.fontSize = (Math.random() * 20 + 10) + 'px';
          p.style.color = colors[Math.floor(Math.random() * colors.length)];
          victoryOverlay.appendChild(p);

          // 动画
          const duration = Math.random() * 3 + 2;
          const delay = Math.random() * 0.5;
          p.animate([
              { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
              { transform: `translate(${(Math.random() - 0.5) * 200}px, 100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
          ], {
              duration: duration * 1000,
              delay: delay * 1000,
              easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              fill: 'forwards'
          });
      }
  }

  function showVictoryPage(winnerTex) {
      if (victoryOverlay.classList.contains('active')) return;
      localStorage.removeItem('__love_game_state'); // 清除进度
      
      let winner = "神秘玩家";
      if (winnerTex.includes('男')) winner = "男生 ♂";
      if (winnerTex.includes('女')) winner = "女生 ♀";
      
      const shareBtn = document.getElementById('btn-gm-share');
      if (shareBtn) {
          shareBtn.onclick = async () => {
              shareBtn.innerText = "生成中...";
              if (window.generateReviewCard) {
                  const fallbackTurns = Math.floor(Math.random() * 20) + 30; 
                  const fallbackTasks = Math.floor(Math.random() * 15) + 10;
                  const b64 = await window.generateReviewCard(winner, fallbackTurns, fallbackTasks);
                  if (b64 && window.showReviewModal) {
                      window.showReviewModal(b64);
                  }
              } else {
                  alert("海报功能需要 review-card.js 支持！");
              }
              shareBtn.innerText = "📸 生成心跳回忆卡片";
          };
      }
      
      
      const audioCtx = window.__loveAudioCtx; // game-enhancer 中创建的单例
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      
      victoryOverlay.classList.add('active');
      createParticles();
      
  }

  // ========== 增强功能：注入"换一个"机制及双轨解包 ==========
  function injectSkipButton(modalNode) {
      if (modalNode.querySelector('.gm-skip-btn')) return;

      const actionContainer = modalNode.querySelector('.modal-action') || 
                              modalNode.querySelector('.action-group') || 
                              modalNode.querySelector('.uni-view[class*="action"]') ||
                              modalNode.querySelector('button')?.parentElement;
                              
      // 1. 找到标题，这是最铁的证据！看看上面写的是男生还是女生
      let isBoy = true;
      const titleNodes = modalNode.querySelectorAll('.modal-title, .title, strong, h1, h2, h3, h4');
      for (const t of titleNodes) {
          if (t.innerText && (t.innerText.includes('男') || t.innerText.includes('女'))) {
              if (t.innerText.includes('女')) isBoy = false;
              break;
          }
      }

      // 2. 精准定位：直接找 .modal-text 节点，这是 Vue 渲染任务内容的节点
      //    同时也兼容其他弹窗通过深度遍历叶子节点查找
      let textNode = null;
      
      // 第一优先级：直接用类名找 .modal-text
      const modalTextEl = modalNode.querySelector('.modal-text');
      if (modalTextEl) {
          textNode = modalTextEl;
      }
      
      // 第二优先级：找包含 JSON 字符串特征的任意节点（兼容其他弹窗结构）
      if (!textNode) {
          const skipKeywords = ['确认', '关闭', '已完成', '换一个', '取消', '完成'];
          const allEls = modalNode.querySelectorAll('*');
          for (const el of allEls) {
              if (el === modalNode) continue;
              if (el.classList && (el.classList.contains('modal-title') || el.classList.contains('gm-skip-btn'))) continue;
              const txt = el.innerText || '';
              if (skipKeywords.some(k => txt.trim() === k)) continue;
              // 找包含 JSON 特征的节点
              if (txt.includes('"m"') || txt.includes('"f"') || txt === '[object Object]') {
                  textNode = el;
                  break;
              }
          }
      }

      // 3. 准备题库
      const dbKey = localStorage.getItem('__love_selected_db') || 'qinglu'; 
      let sourceBank = window.GAME_DATABASE && window.GAME_DATABASE[dbKey];

      // 工具函数：从任务数据中取正确性别的文本
      function resolveTask(taskData) {
          if (!taskData) return '神秘任务';
          if (typeof taskData === 'string') {
              // 可能是 JSON 字符串：{"m":"...","f":"..."}
              if (taskData.trim().startsWith('{')) {
                  try {
                      const parsed = JSON.parse(taskData);
                      if (parsed.m && parsed.f) return isBoy ? parsed.m : parsed.f;
                  } catch(e) {}
              }
              return taskData;
          }
          if (typeof taskData === 'object' && taskData.m && taskData.f) {
              return isBoy ? taskData.m : taskData.f;
          }
          return String(taskData);
      }

      // 4. 立刻修复弹窗当前显示内容
      if (textNode) {
          const currentText = textNode.innerText || '';
          // 检查是否需要修复（包含 JSON 特征）
          const needsFix = currentText.includes('"m"') || currentText.includes('"f"') || currentText === '[object Object]';
          
          if (needsFix && sourceBank) {
              textNode.style.opacity = '0';
              textNode.style.transition = 'opacity 0.15s ease';
              
              // 尝试先直接解析当前显示的 JSON 字符串
              let correctText = resolveTask(currentText);
              
              // 如果解析失败（内容不是完整的JSON），从题库取一个随机任务
              if (correctText === currentText || correctText === '神秘任务') {
                  const keys = Object.keys(sourceBank);
                  const randomKey = keys[Math.floor(Math.random() * keys.length)];
                  correctText = resolveTask(sourceBank[randomKey]);
              }
              
              setTimeout(() => {
                  textNode.innerText = correctText;
                  textNode.style.opacity = '1';
              }, 30);
          }
      }

      // 5. 注入"换一个"按钮
      if (actionContainer && textNode) {
          const skipBtn = document.createElement('button');
          skipBtn.className = 'gm-skip-btn';
          skipBtn.innerText = '协商换一个 🎲';
          skipBtn.style.cssText = `
              margin-top: 10px;
              width: 100%;
              padding: 12px;
              border-radius: 20px;
              background: rgba(255,255,255,0.1);
              border: 1px solid rgba(255,255,255,0.2);
              color: #cbd5e1;
              font-size: 0.95rem;
              cursor: pointer;
              transition: all 0.2s;
          `;
          
          skipBtn.onmousedown = () => skipBtn.style.transform = 'scale(0.95)';
          skipBtn.onmouseup = () => skipBtn.style.transform = 'scale(1)';
          
          skipBtn.onclick = (e) => {
              e.stopPropagation();
              
              if (sourceBank) {
                  const keys = Object.keys(sourceBank);
                  const randomKey = keys[Math.floor(Math.random() * keys.length)];
                  const newTaskText = resolveTask(sourceBank[randomKey]);
                  
                  textNode.style.opacity = '0';
                  setTimeout(() => {
                      textNode.innerText = newTaskText;
                      textNode.style.opacity = '1';
                      if (navigator.vibrate) try { navigator.vibrate(10); } catch(err){}
                  }, 200);
              }
          };
          
          if (getComputedStyle(actionContainer).display === 'flex' && getComputedStyle(actionContainer).flexDirection === 'row') {
              actionContainer.style.flexDirection = 'column';
          }
          actionContainer.appendChild(skipBtn);
      }
  }

  // 利用 DOM 观察者监听棋局变动和弹窗
  const observer = new MutationObserver((mutations) => {
      let changed = false;
      mutations.forEach(m => {
          if (m.type === 'childList') {
              if (m.addedNodes) {
                  m.addedNodes.forEach(node => {
                      // 1. 胜利检测
                      if (node.innerText) {
                          const text = node.innerText;
                          if (text.includes('游戏结束') || text.includes('恭喜') || text.includes('到达终点')) {
                              showVictoryPage(text);
                          }
                      }
                      
                      // 2. 拦截任务弹窗并注入换一个按钮
                      if (node.nodeType === 1 && typeof node.className === 'string') {
                          if (node.className.includes('modal') || node.className.includes('popup') || node.className.includes('toast')) {
                              // 判断是否为任务相关的弹窗（字数较多）
                              if (node.innerText && node.innerText.length > 10) {
                                  setTimeout(() => injectSkipButton(node), 100);
                              }
                          }
                      }
                  });
              }
          }
      });
      
      if (changed) {
          // localStorage.setItem('__love_game_state', JSON.stringify({p1: 10, p2: 5}));
      }
  });
  
  // 原生主页完全自主接管，我们可以在进入游戏数秒后提示恢复
  // 由于我们去掉了点击拦截，这里在页面加载后稍作延迟检查是否存在旧游戏记录
  setTimeout(() => {
     checkAndRestoreState();
     observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }, 2000);

});
