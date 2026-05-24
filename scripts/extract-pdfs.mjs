// Extract raw text from each standards PDF into /standards/raw/*.txt
import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Estandares y expectativas');
const OUT = path.join(ROOT, 'standards', 'raw');

const FILES = [
  { file: 'Matemáticas.pdf',      slug: 'mat' },
  { file: 'Ciencias.pdf',         slug: 'cie' },
  { file: 'Español.pdf',          slug: 'esp' },
  { file: 'Inglés.pdf',           slug: 'ing' },
  { file: 'Estudios Sociales.pdf', slug: 'est' },
];

await fs.mkdir(OUT, { recursive: true });

for (const { file, slug } of FILES) {
  const inPath = path.join(SRC, file);
  console.log(`Extracting ${file}…`);
  const buf  = await fs.readFile(inPath);
  const data = await pdf(buf);
  await fs.writeFile(path.join(OUT, `${slug}.txt`), data.text, 'utf8');
  console.log(`  → ${slug}.txt  (${data.numpages} pages, ${data.text.length.toLocaleString()} chars)`);
}
console.log('Done.');
