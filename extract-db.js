// extract-db.js
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');
const STATIC_DIR = path.join(__dirname, 'static');
const filesToProcess = [
  { mode: 'qinglu', name: 'pages-game-qinglu' },
  { mode: 'gaoji', name: 'pages-game-gaoji' },
  { mode: 'simi', name: 'pages-game-simi' },
  { mode: 'sizu', name: 'pages-game-sizu' },
  { mode: 'sm', name: 'pages-game-sm' },
  { mode: 'nvpu', name: 'pages-game-nvpu' }
];

let globalDatabase = {};

function findFile(prefix) {
  const allFiles = fs.readdirSync(ASSETS_DIR);
  return allFiles.find(f => f.startsWith(prefix) && f.endsWith('.js'));
}

filesToProcess.forEach(item => {
  const filename = findFile(item.name);
  if (!filename) return;
  const filePath = path.join(ASSETS_DIR, filename);
  let content = fs.readFileSync(filePath, 'utf8');

  const extractRegex = /const (\w+)\s*=\s*({(?:[0-9]+:['"][^'"]+['"]\s*,?\s*)+})/;
  
  const match = content.match(extractRegex);
  if (match) {
    const varName = match[1];
    let jsonStringStr = match[2];
    let validJsonStr = jsonStringStr.replace(/([0-9]+):/g, '"$1":');
    let extractedObj = {};
    try {
      extractedObj = JSON.parse(validJsonStr);
      globalDatabase[item.mode] = extractedObj;
      let replacementStr = `const ${varName} = (window.GAME_DATABASE && window.GAME_DATABASE['${item.mode}']) || ${jsonStringStr}`;
      content = content.replace(match[0], replacementStr);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully extracted & injected DB for ${item.mode}`);
    } catch (e) {
      console.error(`Failed to parse for ${item.mode}:`, e.message);
    }
  }
});

if (!fs.existsSync(STATIC_DIR)) fs.mkdirSync(STATIC_DIR);

const dbContent = `/**
 * 情侣飞行棋 - 题库数据中心
 * 这个文件存放了不同模式下的题目和惩罚。你可以自己随意修改！
 * 
 * 修改规则：
 * 1. 只要保持结构正确，每一行前面的数字（格子标号）和冒号不要动。
 * 2. 只有在双引号内部的中文是可以自由修改的。
 */
window.GAME_DATABASE = ${JSON.stringify(globalDatabase, null, 2)};
`;

fs.writeFileSync(path.join(STATIC_DIR, 'database.js'), dbContent, 'utf8');
console.log("Extraction Completed!");
