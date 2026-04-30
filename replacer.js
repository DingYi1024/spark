const fs = require('fs');
const path = require('path');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function stringToUnicodeEscapeRegex(str) {
  let parts = [];
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    let hex = char.charCodeAt(0).toString(16).padStart(4, '0');
    // It can be literal char, or \uXXXX, or \\uXXXX
    let charRegex = `(?:${escapeRegExp(char)}|\\\\?u${hex})`;
    // For ASCII like ':', 'Q', digits, it's often literal or \xXX
    if (char.match(/[a-zA-Z0-9:]/)) {
        let hex2 = char.charCodeAt(0).toString(16).padStart(2, '0');
        charRegex = `(?:${escapeRegExp(char)}|\\\\?u00${hex2}|\\\\?x${hex2})`;
    }
    parts.push(charRegex);
  }
  return parts.join('');
}

const target1 = "微信公众号:腿哥网络";
const target2 = "购买无广告无加密版本请联系QQ:519586";

const replacement1 = "微信公众号:榴叔包子铺";
const replacement2 = "购买无广告无加密版本请联系QQ:5119630";

// Build a string that converts to unicode escape for safety just in case we need to inject it back escaped
function stringToUnicode(str) {
  return str.split('').map(char => {
    let code = char.charCodeAt(0);
    if (code > 127) {
      return '\\u' + code.toString(16).padStart(4, '0');
    }
    return char; // keep ascii as is to not break JSON/JS literal parsing unnecessarily
  }).join('');
}

const rep1_escaped = stringToUnicode(replacement1);
const rep2_escaped = stringToUnicode(replacement2);

const regex1 = new RegExp(stringToUnicodeEscapeRegex(target1), 'gi');
const regex2 = new RegExp(stringToUnicodeEscapeRegex(target2), 'gi');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if(!dirFile.includes('.git') && !dirFile.includes('node_modules')) {
         filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.js') || dirFile.endsWith('.html') || dirFile.endsWith('.css') || dirFile.endsWith('.json')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('d:/opencode/love');
let changedFiles = 0;

files.forEach(file => {
  if (file.includes('replacer.js')) return; // skip self
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // We need to match whatever format it's originally in to decide the replacement format,
  // but for simplicity, since it's inside JS strings, we can just replace with our unicode-escaped strings
  // which works universally.
  
  content = content.replace(regex1, (match) => {
    console.log(`Found target1 in ${file}: ${match}`);
    // if original was escaped, use escaped replacement
    return match.includes('\\u') ? rep1_escaped : replacement1;
  });

  content = content.replace(regex2, (match) => {
    console.log(`Found target2 in ${file}: ${match}`);
    return match.includes('\\u') ? rep2_escaped : replacement2;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
  }
});

console.log('Total files modified:', changedFiles);
