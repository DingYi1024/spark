const fs = require('fs');
const path = require('path');
const ASSETS = path.join('d:/opencode/love', 'assets');
const files = fs.readdirSync(ASSETS).filter(f => f.startsWith('pages-game-') && f.endsWith('.js'));

files.forEach(file => {
  let filepath = path.join(ASSETS, file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Regex to find: const t=(window.GAME_DATABASE && window.GAME_DATABASE['qinglu']) || {1:"...", 2:"..."}
  // Because it can be long, we carefully match the structure.
  let regex = /const (\w+)\s*=\s*\(\s*window\.GAME_DATABASE\s*&&\s*window\.GAME_DATABASE\['[^']+'\]\s*\)\s*\|\|\s*(\{.*?\})\s*(,|;)/;
  
  let match = content.match(regex);
  if (match) {
    let varName = match[1];
    let objData = match[2];
    let delimiter = match[3];
    let originalStr = match[0];
    let replacedStr = `const ${varName}=${objData}${delimiter}`;
    
    content = content.replace(originalStr, replacedStr);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Restored JS payload in:', file);
  }
});
