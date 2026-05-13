const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'js');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.endsWith('.chunk.js') && !/^main\..*\.js$/.test(f));
const jsxCandidates = [];
const jsxRegex = /<\/?[A-Za-z][^>]*>/;
files.forEach(f => {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  if (jsxRegex.test(text)) {
    jsxCandidates.push(f);
  }
});
console.log('Renaming', jsxCandidates.length, 'files to .jsx');
jsxCandidates.forEach(f => {
  const from = path.join(dir, f);
  const to = path.join(dir, f.replace(/\.js$/, '.jsx'));
  fs.renameSync(from, to);
  console.log('Renamed', f, '->', path.basename(to));
});
