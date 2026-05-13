const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'js');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
const missing = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const regex = /import\s+['\"](\.\/[^'\"]+\.css)['\"]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const cssPath = path.join(dir, m[1]);
    if (!fs.existsSync(cssPath)) {
      missing.push({file, import: m[1]});
    }
  }
}
console.log(JSON.stringify(missing, null, 2));
