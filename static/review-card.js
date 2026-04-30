/**
 * review-card.js
 * 负责在游戏结束时生成情侣专属“游戏回顾海报”。
 */

document.addEventListener('DOMContentLoaded', () => {

    // 动态注入 html2canvas
    const script = document.createElement('script');
    script.src = 'node_modules/html2canvas/dist/html2canvas.min.js';
    document.head.appendChild(script);

    // 注入用于绘制海报的隐藏 DOM 模板
    const cardTemplate = document.createElement('div');
    cardTemplate.id = 'gm-review-card-template';
    cardTemplate.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 375px;
        height: 667px;
        background: linear-gradient(135deg, #fdf2f8, #fbcfe8 40%, #f472b6);
        padding: 30px;
        box-sizing: border-box;
        font-family: -apple-system, sans-serif;
        color: #1e293b;
        display: flex;
        flex-direction: column;
        border-radius: 24px;
        overflow: hidden;
    `;
    cardTemplate.innerHTML = `
        <div style="text-align:center; flex:1;">
             <h1 style="color:#be185d; font-size:2rem; margin-top:20px; font-weight:900; letter-spacing:2px;">LOVE FLIGHT</h1>
             <p style="color:#ec4899; font-size:1.1rem; font-weight:bold; margin-top:5px;">心跳回忆档案</p>
             
             <div style="background:rgba(255,255,255,0.8); backdrop-filter:blur(10px); border-radius:20px; padding:30px 20px; margin-top:40px; box-shadow:0 10px 30px rgba(236,72,153,0.2);">
                 <h2 id="rc-winner" style="font-size:1.5rem; margin-bottom:15px; color:#1e293b;">本次赢家：???</h2>
                 
                 <div style="font-size:1.1rem; color:#475569; line-height:1.8; margin-top:20px; text-align:left;">
                    <p>🎲 总计掷骰：<strong id="rc-turns" style="color:#be185d">0</strong> 次</p>
                    <p>🔥 触发专属：<strong id="rc-tasks" style="color:#be185d">0</strong> 个惩罚</p>
                    <p>🏆 终极奖励：</p>
                    <p style="font-size:0.95rem; font-style:italic; background:#fef2f6; padding:10px; border-radius:8px; margin-top:5px;">输的一方需要答应赢的一方任意一个条件！这属于今晚的最终大奖。</p>
                 </div>
             </div>
             
             <div style="position:absolute; bottom:30px; left:0; right:0; text-align:center;">
                 <p style="font-size:0.85rem; color:#be185d; opacity:0.8;">生成自「情侣飞行棋 Vanilla V2.0」</p>
             </div>
        </div>
    `;
    document.body.appendChild(cardTemplate);

    // 全局方法给 engine.js 调用
    window.generateReviewCard = async function(winnerName, totalTurns, totalTasks) {
        if (!window.html2canvas) {
            alert("海报生成模块还在加载中，请稍后再试！");
            return null;
        }

        document.getElementById('rc-winner').innerText = `本次赢家：${winnerName}`;
        document.getElementById('rc-turns').innerText = totalTurns;
        document.getElementById('rc-tasks').innerText = totalTasks;

        try {
            const canvas = await html2canvas(document.getElementById('gm-review-card-template'), {
                scale: 2, // 提高清晰度
                backgroundColor: null
            });
            const dataUrl = canvas.toDataURL('image/png');
            return dataUrl;
        } catch(e) {
            console.error("生成回顾卡片失败:", e);
            return null;
        }
    };

    window.showReviewModal = function(base64Image) {
        let modal = document.getElementById('gm-review-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'gm-review-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.85);
                z-index: 10000000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(5px);
            `;
            modal.innerHTML = `
                <h3 style="color:white; margin-bottom:20px; font-weight:normal;">长按下方卡片保存相册 👇</h3>
                <img id="gm-review-img" src="" style="width: 80%; max-width: 320px; border-radius: 16px; box-shadow: 0 10px 40px rgba(236,72,153,0.5);">
                <button id="gm-review-close" style="margin-top: 30px; padding: 12px 40px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.5); background: transparent; color: white; font-size: 1.1rem;">返回游戏</button>
            `;
            document.body.appendChild(modal);

            document.getElementById('gm-review-close').onclick = () => {
                modal.style.opacity = '0';
                modal.style.pointerEvents = 'none';
            };
        }

        document.getElementById('gm-review-img').src = base64Image;
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
    };
});
