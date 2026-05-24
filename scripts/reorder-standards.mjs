// Move `estandares` field to the END of each tool's fields array.
import fs from 'node:fs/promises';

const path = 'src/data/toolsConfig.js';
let src = await fs.readFile(path, 'utf8');

// Find each `fields: [...]` block, accounting for nested brackets + strings
function findFieldsBlocks(text) {
  const out = [];
  const needle = 'fields: [';
  let i = 0;
  while (true) {
    const idx = text.indexOf(needle, i);
    if (idx < 0) break;
    let depth = 1;
    let j = idx + needle.length;
    let inStr = null;
    while (j < text.length && depth > 0) {
      const ch = text[j];
      if (inStr) {
        if (ch === '\\' && j + 1 < text.length) { j += 2; continue; }
        if (ch === inStr) inStr = null;
      } else {
        if (ch === "'" || ch === '"' || ch === '`') inStr = ch;
        else if (ch === '[') depth++;
        else if (ch === ']') depth--;
      }
      j++;
    }
    out.push([idx, j]);
    i = j;
  }
  return out;
}

const STD_RE = /^[ \t]*\{\s*name:\s*'estandares'[^\n]*\n/m;

const blocks = findFieldsBlocks(src);
console.log(`Found ${blocks.length} fields blocks`);
let moved = 0;
for (let k = blocks.length - 1; k >= 0; k--) {
  const [start, end] = blocks[k];
  const block = src.slice(start, end);
  const m = block.match(STD_RE);
  if (!m) continue;
  const stdLine = m[0];
  const without = block.slice(0, m.index) + block.slice(m.index + m[0].length);
  const closeIdx = without.lastIndexOf(']');
  if (closeIdx < 0) continue;
  const updated = without.slice(0, closeIdx) + stdLine + without.slice(closeIdx);
  src = src.slice(0, start) + updated + src.slice(end);
  moved++;
}
await fs.writeFile(path, src, 'utf8');
console.log(`Moved estandares to end in ${moved} tools.`);
