// d:\opencode\love\static\task-timer.js
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject CSS for the Floating Timer
  const style = document.createElement('style');
  style.innerHTML = `
    #task-timer-overlay {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(150%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 16px;
      padding: 15px 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      width: 90%;
      max-width: 400px;
    }
    #task-timer-overlay.active {
      transform: translateX(-50%) translateY(0);
    }
    .tt-header { color: #f8fafc; font-size: 0.9rem; font-weight: bold; letter-spacing: 1px; }
    .tt-time { font-size: 3rem; font-weight: 900; color: #ec4899; text-shadow: 0 0 15px rgba(236,72,153,0.5); font-variant-numeric: tabular-nums; line-height: 1; }
    .tt-time.done { color: #10b981; text-shadow: 0 0 15px rgba(16,185,129,0.5); }
    .tt-controls { display: flex; gap: 10px; width: 100%; justify-content: center; margin-top: 5px; }
    .tt-btn {
      flex: 1; padding: 12px 0; border: none; border-radius: 10px; font-weight: bold; font-size: 1rem; cursor: pointer; color: #fff;
      transition: all 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    .tt-btn:active { transform: scale(0.95); }
    .tt-btn.start { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .tt-btn.pause { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .tt-btn.reset { background: linear-gradient(135deg, #64748b, #475569); }
    .tt-btn.close { background: linear-gradient(135deg, #ef4444, #dc2626); flex: 0.3; font-size: 1.2rem; }
  `;
  document.head.appendChild(style);

  // 2. Inject HTML nodes for Timer
  const overlay = document.createElement('div');
  overlay.id = 'task-timer-overlay';
  overlay.innerHTML = `
    <div class="tt-header">任务执行倒计时</div>
    <div class="tt-time" id="tt-display">00:00</div>
    <div class="tt-controls">
      <button class="tt-btn start" id="tt-start">开始执行</button>
      <button class="tt-btn pause" id="tt-pause" style="display:none;">暂停</button>
      <button class="tt-btn reset" id="tt-reset">重新执行</button>
      <button class="tt-btn close" id="tt-close">×</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const display = document.getElementById('tt-display');
  const btnStart = document.getElementById('tt-start');
  const btnPause = document.getElementById('tt-pause');
  const btnReset = document.getElementById('tt-reset');
  const btnClose = document.getElementById('tt-close');

  let defaultTime = 0;
  let remainingTime = 0;
  let timerInterval = null;
  let isRunning = false;

  // 复用 game-enhancer.js 创建的全局 AudioContext 单例，避免浏览器多实例限制
  function beep(type) {
    if (!window.__loveAudioCtx) {
      window.__loveAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioCtx = window.__loveAudioCtx;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'end') {
      // 结束音：轻柔两音阶，音量调低
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.08);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      if (navigator.vibrate) try { navigator.vibrate([80, 40, 80]); } catch(e){}
    } else {
      // 其他操作：轻短提示音
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.03);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
      if (navigator.vibrate) try { navigator.vibrate(15); } catch(e){}
    }
  }


  function formatTime(secs) {
    let m = Math.floor(secs / 60).toString().padStart(2, '0');
    let s = (secs % 60).toString().padStart(2, '0');
    return m + ':' + s;
  }

  function updateDisplay() {
    display.innerText = formatTime(remainingTime);
    if (remainingTime <= 0) {
      display.classList.add('done');
    } else {
      display.classList.remove('done');
    }
  }

  function startTimer() {
    if (remainingTime <= 0) return;
    if (timerInterval) clearInterval(timerInterval);
    isRunning = true;
    btnStart.style.display = 'none';
    btnPause.style.display = 'block';
    btnPause.innerText = '暂停';
    beep('start');
    
    timerInterval = setInterval(() => {
      remainingTime--;
      updateDisplay();
      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        btnStart.style.display = 'block';
        btnPause.style.display = 'none';
        btnStart.innerText = '执行完毕';
        beep('end');
      }
    }, 1000);
  }

  function pauseTimer() {
    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      btnPause.innerText = '继续';
      beep('pause');
    } else {
      startTimer();
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    remainingTime = defaultTime;
    btnStart.style.display = 'block';
    btnStart.innerText = '开始执行';
    btnPause.style.display = 'none';
    btnPause.innerText = '暂停';
    updateDisplay();
    beep('reset');
  }

  function closeTimer() {
    clearInterval(timerInterval);
    overlay.classList.remove('active');
  }

  btnStart.addEventListener('click', () => {
    if (remainingTime <= 0) closeTimer();
    else startTimer();
  });
  btnPause.addEventListener('click', pauseTimer);
  btnReset.addEventListener('click', resetTimer);
  btnClose.addEventListener('click', closeTimer);

  // 3. MutationObserver to auto-detect popups containing Time
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mut => {
      if (mut.addedNodes && mut.addedNodes.length > 0) {
        mut.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.innerText) {
            // Check if it's a typical Uniapp modal or popup wrapper
            if (typeof node.className === 'string' && (node.className.includes('modal') || node.className.includes('popup') || node.className.includes('toast'))) {
              let text = node.innerText;
              // Extract Chinese time durations: "30秒", "1分钟", "一分钟", "两分钟", "半分钟"
              const cnNumMap = {'一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10};
              let match = text.match(/([0-9一二两三四五六七八九十]+)\s*(秒|分钟|分)/);
              let totalSecs = 0;
              
              if (match) {
                let valStr = match[1];
                let unit = match[2];
                let val = 0;
                
                if (/^\d+$/.test(valStr)) {
                  val = parseInt(valStr);
                } else {
                  // Basic Chinese number parsing
                  if (valStr.length === 1) {
                    val = cnNumMap[valStr] || 0;
                  } else if (valStr === '十') {
                    val = 10;
                  } else if (valStr.startsWith('十')) {
                    val = 10 + (cnNumMap[valStr[1]] || 0);
                  } else if (valStr.endsWith('十')) {
                    val = (cnNumMap[valStr[0]] || 0) * 10;
                  }
                }
                
                if (unit === '秒') totalSecs = val;
                else if (unit === '分钟' || unit === '分') totalSecs = val * 60;
              } else if (text.includes('半分钟')) {
                totalSecs = 30;
              }

              if (totalSecs > 0) {
                defaultTime = totalSecs;
                resetTimer();
                // Pop up the timer overlay
                setTimeout(() => {
                  overlay.classList.add('active');
                }, 100);
              }
            }
          }
        });
      }
    });
  });

  // Start observing
  observer.observe(document.body, { childList: true, subtree: true });
});
