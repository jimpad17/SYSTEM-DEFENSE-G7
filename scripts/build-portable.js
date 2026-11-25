/* Build a single self-contained HTML file: CSS + JS inlined.
   Run: node scripts/build-portable.js
   Output: FleetForward-Portable.html */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'app', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'app', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app', 'app.js'), 'utf8');

if (js.includes('</script')) throw new Error('app.js contains </script, cannot inline safely');

// Use replacer FUNCTIONS: a plain string replacement would interpret "$$" in app.js
// as an escaped "$" and silently corrupt the $$() helper.
let out = html
  .replace('<link rel="stylesheet" href="styles.css">', () => '<style>\n' + css + '\n</style>')
  .replace('<script src="app.js"></script>', () => '<script>\n' + js + '\n</script>');

if (out.includes('href="styles.css"') || out.includes('src="app.js"')) {
  throw new Error('Inlining failed — external references still present');
}

const file = path.join(root, 'FleetForward-Portable.html');
fs.writeFileSync(file, out, 'utf8');
console.log('Portable single-file app saved:', file, '| bytes:', Buffer.byteLength(out));
