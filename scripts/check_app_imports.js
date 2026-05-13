const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'js', 'App.jsx');
const text = fs.readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/);
const imports = [];
for (const line of lines) {
  const m = line.match(/^import\s+.*?from\s+['\"](.+)['\"];/);
  if (m) imports.push(m[1]);
}
const missing = imports.filter(imp => {
  const p = path.join(__dirname, '..', 'js', imp);
  return !fs.existsSync(p) && !fs.existsSync(p + '.jsx') && !fs.existsSync(p + '.js');
});
console.log(JSON.stringify({missing, imports}, null, 2));
