const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'terrain06.htm');
const htmlSource = fs.readFileSync(srcFile, 'utf8');

const scriptStart = htmlSource.indexOf('<script>');
const scriptEnd = htmlSource.lastIndexOf('<\/script>');

if (scriptStart === -1 || scriptEnd === -1) {
  console.error('Could not find script tags');
  process.exit(1);
}

const jsSource = htmlSource.substring(scriptStart + 8, scriptEnd);
const htmlHeader = htmlSource.substring(0, scriptStart);
const htmlFooter = htmlSource.substring(scriptEnd + 9);

const jsDir = path.join(__dirname, 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir);
}

function extractRegion(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) return null;
  const end = endMarker ? source.indexOf(endMarker, start) : source.length;
  if (end === -1) return source.substring(start);
  return source.substring(start, end);
}

// 1. engine-utils.js
const utilsContent = extractRegion(jsSource, '// ─── UTILITY ───', '// ─── DATA: BASE BIOMES ───');
const helpersContent = extractRegion(jsSource, '// ─── HELPERS ───', '// ─── DIFFICULTY SELECTOR ───');
let soundContent = extractRegion(jsSource, '// --- SE ---', '// ─── INIT（初期化）───');
// Since clearRestIfFinished is before INIT but might be part of save engine, we should be careful.
const seEnd = soundContent.indexOf('function clearRestIfFinished');
const seSource = seEnd > -1 ? soundContent.substring(0, seEnd) : soundContent;
fs.writeFileSync(path.join(jsDir, 'engine-utils.js'), (utilsContent + "\n" + helpersContent + "\n" + seSource).trim());

// 2. data-biomes.js
const diffPresets = extractRegion(jsSource, 'const DIFFICULTY_PRESETS', '// ─── DATA: BASE BIOMES ───');
let biomesContent = extractRegion(jsSource, '// ─── DATA: BASE BIOMES ───', '// ─── DATA: WORLD (Level/Tier info) ───');
if (!biomesContent) {
  // Let's just find the arrays manually if regions are different
  biomesContent = 'const BIOMES = ' + extractRegion(jsSource, 'const BIOMES = [', '];\n') + '];\n';
}
fs.writeFileSync(path.join(jsDir, 'data-biomes.js'), (diffPresets + "\n" + biomesContent).trim());

// I'll update the script iteratively so I can run and check.
console.log('Script written. Run node split.js manually if this works.');
