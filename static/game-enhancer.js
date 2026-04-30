/**
 * Game Enhancer Script (V2.x)
 *
 * 改进清单：
 * 1. AudioContext 全局单例（供 task-timer.js 共享，避免浏览器实例数过多报错）
 * 2. BGM 完全重写：通过谐波叠加 + ADSR 包络 + 简单和弦进行合成接近钢琴/弦乐质感的氛围音
 * 3. 优化了骰子、点击、弹窗的音效层次感
 */

document.addEventListener('DOMContentLoaded', () => {

  // =====================================================================
  // 【核心】全局唯一 AudioContext 单例
  // task-timer.js 也从这里取，避免浏览器多实例限制 (通常最多允许 6 个)
  // =====================================================================
  if (!window.__loveAudioCtx) {
    window.__loveAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const audioCtx = window.__loveAudioCtx;

  // 主音量节点（全局统一调节）
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(audioCtx.destination);

  function resumeCtx() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  // =====================================================================
  // 音效函数：使用谐波叠加后接 ADSR 包络，模拟乐器质感
  // =====================================================================

  /**
   * 合成一个钢琴样的音符
   * @param {number} freq - 基频
   * @param {number} startTime
   * @param {number} duration
   * @param {number} velocity - 响度 0-1
   */
  function synthNote(freq, startTime, duration, velocity = 0.5) {
    // 谐波叠加：1x, 2x, 4x 泛音，衰减递减
    const harmonics = [1, 2, 4, 8];
    const weights   = [1, 0.5, 0.2, 0.05];

    harmonics.forEach((h, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * h;
      osc.connect(gain);
      gain.connect(masterGain);

      // ADSR 包络
      const att = 0.01;
      const dec = 0.1;
      const sus = velocity * weights[i] * 0.4;
      const rel = 0.3;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(velocity * weights[i], startTime + att);
      gain.gain.linearRampToValueAtTime(sus, startTime + att + dec);
      gain.gain.setValueAtTime(sus, startTime + duration - rel);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  }

  function playSynth(type) {
    resumeCtx();
    const now = audioCtx.currentTime;

    if (type === 'click') {
      // 轻柔的短促音（类似木琴点击）
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.12);

    } else if (type === 'dice') {
      // 模拟骰子滚动：一组快速随机音调（类似拨弦）
      for (let i = 0; i < 6; i++) {
        const delay = i * 0.08;
        const freq = 300 + Math.random() * 400;
        synthNote(freq, now + delay, 0.12, 0.25);
      }

    } else if (type === 'popup') {
      // 弹框出现：升调的两音和弦
      synthNote(523.25, now, 0.4, 0.4);       // C5
      synthNote(659.25, now + 0.12, 0.4, 0.35); // E5
      synthNote(783.99, now + 0.24, 0.5, 0.3);  // G5
    }
  }

  function vibrate(pattern) {
    if (navigator.vibrate) try { navigator.vibrate(pattern); } catch (e) {}
  }

  // =====================================================================
  // 全局交互监听：点击音效 + 震动
  // =====================================================================
  document.body.addEventListener('click', (e) => {
    const isInteractive =
      e.target.tagName === 'BUTTON' ||
      e.target.closest('view[class*="btn"]') ||
      e.target.closest('.rule-item') ||
      e.target.closest('.uni-view');

    if (isInteractive) {
      if (!window.__lastClick || Date.now() - window.__lastClick > 100) {
        window.__lastClick = Date.now();
        playSynth('click');
        vibrate(15);
      }
    }
  });

  // DOM 变化监听：弹窗音效 + 骰子音效
  const enhancerObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // 弹窗出现时不再自动播放音效（太聒噪）
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'style' &&
        mutation.target.className &&
        mutation.target.className.includes('cube')
      ) {
        if (!window.__diceRolling) {
          window.__diceRolling = true;
          playSynth('dice');
          vibrate([20, 30, 20]);
          setTimeout(() => { window.__diceRolling = false; }, 700);
        }
      }
    });
  });
  enhancerObserver.observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class']
  });

  // =====================================================================
  // BGM 模块 V2 - 浪漫钢琴氛围旋律
  // =====================================================================

  // 用 C 大调的 I-V-vi-IV 和弦进行（最经典的浪漫进行）
  // 节奏：每 4 秒换一个和弦，每拍 0.5 秒
  //
  // 和弦音符（钢琴中低音区，频率 Hz）：
  // I   = C4 E4 G4  (261.6, 329.6, 392.0)
  // V   = G3 B3 D4  (196.0, 246.9, 293.7)
  // vi  = A3 C4 E4  (220.0, 261.6, 329.6)
  // IV  = F3 A3 C4  (174.6, 220.0, 261.6)

  const CHORD_PROG = [
    [261.6, 329.6, 392.0],  // I
    [196.0, 246.9, 293.7],  // V
    [220.0, 261.6, 329.6],  // vi
    [174.6, 220.0, 261.6],  // IV
  ];

  // 右手旋律（高音区，C 大调，温柔上扬型）
  const MELODY = [
    523.25, 587.33, 659.25, 698.46,  // C5 D5 E5 F5  (第一小节)
    740.0,  659.25, 587.33, 523.25,  // F#5 E5 D5 C5 (第二小节)
    440.0,  493.88, 523.25, 587.33,  // A4 B4 C5 D5  (第三小节)
    523.25, 493.88, 440.0,  392.0,   // C5 B4 A4 G4  (第四小节)
  ];

  let bgmSchedulerTimer = null;
  let bgmPlaying = false;
  let bgmStartTime = 0;
  let bgmGainNode = null;

  const BEAT = 0.5;      // 每拍 0.5 秒
  const CHORD_DUR = 4;   // 每个和弦 4 拍 = 2 秒

  function scheduleBGMChunk(startAt, chordIndex, melodyOffset) {
    if (!bgmPlaying) return;
    resumeCtx();

    const chord = CHORD_PROG[chordIndex % CHORD_PROG.length];

    // 1. 左手：和弦（较长 duration，低音量）
    chord.forEach(freq => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(bgmGainNode);

      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.18, startAt + 0.05);
      gain.gain.setValueAtTime(0.18, startAt + CHORD_DUR - 0.3);
      gain.gain.linearRampToValueAtTime(0, startAt + CHORD_DUR);
      osc.start(startAt);
      osc.stop(startAt + CHORD_DUR + 0.1);
    });

    // 2. 右手：旋律（每拍一个音符）
    for (let beat = 0; beat < 4; beat++) {
      const noteIdx = (melodyOffset + beat) % MELODY.length;
      const noteFreq = MELODY[noteIdx];
      const noteTime = startAt + beat * BEAT;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle'; // 三角波比正弦波更像钢琴的高频泛音
      osc.frequency.value = noteFreq;
      osc.connect(gain);
      gain.connect(bgmGainNode);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + BEAT * 0.9);
      osc.start(noteTime);
      osc.stop(noteTime + BEAT);
    }
  }

  function startBGMLoop() {
    if (!bgmGainNode) {
      bgmGainNode = audioCtx.createGain();
      bgmGainNode.gain.value = 0.5;
      bgmGainNode.connect(audioCtx.destination);
    }

    bgmPlaying = true;
    let chordIdx = 0;
    let melodyOffset = 0;
    let nextScheduleAt = audioCtx.currentTime;

    function tick() {
      if (!bgmPlaying) return;
      // 提前 0.2 秒调度下一块，避免卡顿
      while (nextScheduleAt < audioCtx.currentTime + 0.3) {
        scheduleBGMChunk(nextScheduleAt, chordIdx, melodyOffset);
        chordIdx = (chordIdx + 1) % CHORD_PROG.length;
        melodyOffset = (melodyOffset + 4) % MELODY.length;
        nextScheduleAt += CHORD_DUR;
      }
      bgmSchedulerTimer = setTimeout(tick, 100);
    }
    tick();
  }

  function stopBGM() {
    bgmPlaying = false;
    clearTimeout(bgmSchedulerTimer);
    if (bgmGainNode) {
      bgmGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
      setTimeout(() => {
        bgmGainNode && bgmGainNode.disconnect();
        bgmGainNode = null;
      }, 1000);
    }
  }

  // =====================================================================
  // BGM 控制按钮 UI
  // =====================================================================
  const bgmBtn = document.createElement('button');
  bgmBtn.id = 'gm-bgm-btn';
  bgmBtn.innerHTML = '🔇';
  bgmBtn.title = '开启氛围音乐';
  bgmBtn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255,255,255,0.25);
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    z-index: 99999;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  `;

  const bgmStyle = document.createElement('style');
  bgmStyle.innerHTML = `
    @keyframes pulse-bgm {
      0%   { box-shadow: 0 0 0 0 rgba(236,72,153,0.5); }
      70%  { box-shadow: 0 0 0 10px rgba(236,72,153,0); }
      100% { box-shadow: 0 0 0 0 rgba(236,72,153,0); }
    }
    #gm-bgm-btn.playing {
      animation: pulse-bgm 2s infinite;
      border-color: #ec4899 !important;
      background: rgba(236,72,153,0.2) !important;
    }
    #gm-bgm-btn:hover {
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(bgmStyle);
  document.body.appendChild(bgmBtn);

  bgmBtn.addEventListener('click', () => {
    resumeCtx();
    if (bgmPlaying) {
      stopBGM();
      bgmBtn.innerHTML = '🔇';
      bgmBtn.title = '开启氛围音乐';
      bgmBtn.classList.remove('playing');
    } else {
      startBGMLoop();
      bgmBtn.innerHTML = '🎵';
      bgmBtn.title = '关闭氛围音乐';
      bgmBtn.classList.add('playing');
    }
  });

});
