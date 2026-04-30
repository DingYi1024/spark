const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.js') || dirFile.endsWith('.css') || dirFile.endsWith('.html')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('d:/opencode/love');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace plain urls
  content = content.replace(/https:\/\/cloud\.2fk\.cn\/qlfxq\/nan\.png/g, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRCbHVlIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzM4YmRmOCIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMzYjgyZjYiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzFlM2E4YSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImlubmVyR2xvd0JsdWUiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwLjkiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgCiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNDgiIGZpbGw9InVybCgjZ3JhZEJsdWUpIiAvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjIiIHI9IjQ4IiBmaWxsPSJub25lIiBzdHJva2U9IiMxZDRlZDgiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW9wYWNpdHk9IjAuNyIvPgogIDxlbGxpcHNlIGN4PSI2MCIgY3k9IjI4IiByeD0iMjgiIHJ5PSIxMCIgZmlsbD0idXJsKCNpbm5lckdsb3dCbHVlKSIvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjQ2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIvPgogIAogIDxnIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGZpbGw9Im5vbmUiPgogICAgPGNpcmNsZSBjeD0iNTIiIGN5PSI2OCIgcj0iMTQiLz4KICAgIDxsaW5lIHgxPSI2MiIgeTE9IjU4IiB4Mj0iNzYiIHkyPSI0NCIvPgogICAgPHBvbHlsaW5lIHBvaW50cz0iNjQsNDQgNzYsNDQgNzYsNTYiLz4KICA8L2c+Cjwvc3ZnPgo=');
  content = content.replace(/https:\/\/cloud\.2fk\.cn\/qlfxq\/nv\.png/g, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRQaW5rIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2Y0NzJiNiIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiNlMTFkNDgiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzg4MTMzNyIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImlubmVyR2xvd1BpbmsiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwLjkiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgCiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNDgiIGZpbGw9InVybCgjZ3JhZFBpbmspIiAvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjIiIHI9IjQ4IiBmaWxsPSJub25lIiBzdHJva2U9IiNiZTE4NWQiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW9wYWNpdHk9IjAuNyIvPgogIDxlbGxpcHNlIGN4PSI2MCIgY3k9IjI4IiByeD0iMjgiIHJ5PSIxMCIgZmlsbD0idXJsKCNpbm5lckdsb3dQaW5rKSIvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjQ2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIvPgogIAogIDxnIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGZpbGw9Im5vbmUiPgogICAgPGNpcmNsZSBjeD0iNjAiIGN5PSI1MiIgcj0iMTQiLz4KICAgIDxsaW5lIHgxPSI2MCIgeTE9IjY2IiB4Mj0iNjAiIHkyPSI4NCIvPgogICAgPGxpbmUgeDE9IjUwIiB5MT0iNzYiIHgyPSI3MCIgeTI9Ijc2Ii8+CiAgPC9nPgo8L3N2Zz4K');
  
  // Replace escaped urls (e.g. \u0068...)
  content = content.replace(/\\u0068\\u0074\\u0074\\u0070\\u0073\\u003A\\u002F\\u002F\\u0063\\u006C\\u006F\\u0075\\u0064\\u002E\\u0032\\u0066\\u006B\\u002E\\u0063\\u006E\\u002F\\u0071\\u006C\\u0066\\u0078\\u0071\\u002F\\u006E\\u0061\\u006E\\u002E\\u0070\\u006E\\u0067/g, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRCbHVlIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzM4YmRmOCIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMzYjgyZjYiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzFlM2E4YSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImlubmVyR2xvd0JsdWUiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwLjkiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgCiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNDgiIGZpbGw9InVybCgjZ3JhZEJsdWUpIiAvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjIiIHI9IjQ4IiBmaWxsPSJub25lIiBzdHJva2U9IiMxZDRlZDgiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW9wYWNpdHk9IjAuNyIvPgogIDxlbGxpcHNlIGN4PSI2MCIgY3k9IjI4IiByeD0iMjgiIHJ5PSIxMCIgZmlsbD0idXJsKCNpbm5lckdsb3dCbHVlKSIvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjQ2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIvPgogIAogIDxnIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGZpbGw9Im5vbmUiPgogICAgPGNpcmNsZSBjeD0iNTIiIGN5PSI2OCIgcj0iMTQiLz4KICAgIDxsaW5lIHgxPSI2MiIgeTE9IjU4IiB4Mj0iNzYiIHkyPSI0NCIvPgogICAgPHBvbHlsaW5lIHBvaW50cz0iNjQsNDQgNzYsNDQgNzYsNTYiLz4KICA8L2c+Cjwvc3ZnPgo=');
  
  content = content.replace(/\\u0068\\u0074\\u0074\\u0070\\u0073\\u003A\\u002F\\u002F\\u0063\\u006C\\u006F\\u0075\\u0064\\u002E\\u0032\\u0066\\u006B\\u002E\\u0063\\u006E\\u002F\\u0071\\u006C\\u0066\\u0078\\u0071\\u002F\\u006E\\u0076\\u002E\\u0070\\u006E\\u0067/g, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRQaW5rIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2Y0NzJiNiIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiNlMTFkNDgiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzg4MTMzNyIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImlubmVyR2xvd1BpbmsiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwLjkiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgCiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNDgiIGZpbGw9InVybCgjZ3JhZFBpbmspIiAvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjIiIHI9IjQ4IiBmaWxsPSJub25lIiBzdHJva2U9IiNiZTE4NWQiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW9wYWNpdHk9IjAuNyIvPgogIDxlbGxpcHNlIGN4PSI2MCIgY3k9IjI4IiByeD0iMjgiIHJ5PSIxMCIgZmlsbD0idXJsKCNpbm5lckdsb3dQaW5rKSIvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjQ2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIvPgogIAogIDxnIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGZpbGw9Im5vbmUiPgogICAgPGNpcmNsZSBjeD0iNjAiIGN5PSI1MiIgcj0iMTQiLz4KICAgIDxsaW5lIHgxPSI2MCIgeTE9IjY2IiB4Mj0iNjAiIHkyPSI4NCIvPgogICAgPGxpbmUgeDE9IjUwIiB5MT0iNzYiIHgyPSI3MCIgeTI9Ijc2Ii8+CiAgPC9nPgo8L3N2Zz4K');
  
  // Replace absolute static asset imports with relative to make subfolder deployment work
  if (file.endsWith('.js') || file.endsWith('.html')) {
    content = content.replace(/'\/static\//g, "'./static/");
    content = content.replace(/"\/static\//g, '"./static/');
    content = content.replace(/`\/static\//g, "`./static/");
  } else if (file.endsWith('.css')) {
    content = content.replace(/url\(\/static\//g, "url(../static/"); // CSS is in /assets/, so static is in ../static/
    content = content.replace(/url\(\/assets\//g, "url("); // inside /assets/, /assets/xxx -> xxx
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log('Modified:', file);
  }
});
console.log('Total files modified:', changedFiles);
