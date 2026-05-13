const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'js');
const renameFiles = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.endsWith('.chunk.js') && !/^main\..*\.js$/.test(f) && f !== 'reportWebVitals.js');
const grouped = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const m = line.match(/from\s+['\"](.+?\.js)['\"]/);
    if (m) {
      const imp = m[1];
      if (renameFiles.includes(path.basename(imp))) {
        grouped[f] = grouped[f] || [];
        grouped[f].push({ line: idx + 1, imp });
      }
    }
    const m2 = line.match(/require\(\s*['\"](.+?\.js)['\"]\s*\)/);
    if (m2) {
      const imp = m2[1];
      if (renameFiles.includes(path.basename(imp))) {
        grouped[f] = grouped[f] || [];
        grouped[f].push({ line: idx + 1, imp });
      }
    }
  });
}
console.log(JSON.stringify(grouped, null, 2));
