/**
 * Parse raw PDF text → pr-{subj}-{grade}.json files matching standards/schema.json.
 *
 * Strategy: concatenate all lines (minus header/footer junk) into a single text blob,
 * then walk all code-token matches in order. The text between code_i and code_{i+1}
 * is the expectation for code_i. This handles cases where codes appear mid-line
 * (PDF text extraction often glues continuations).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW  = path.join(ROOT, 'standards', 'raw');
const OUT  = path.join(ROOT, 'standards');

const SUBJECTS = {
  mat: { name: 'Matemáticas',       source: 'DEPR Estándares de Contenido y Expectativas de Grado — Matemáticas (2022)' },
  cie: { name: 'Ciencias',          source: 'DEPR Estándares de Contenido y Expectativas de Grado — Ciencias (2022)' },
  esp: { name: 'Español',           source: 'DEPR Estándares de Contenido y Expectativas de Grado — Español (2022)' },
  ing: { name: 'Inglés',            source: 'DEPR Estándares de Contenido y Expectativas de Grado — Inglés (2022)' },
  est: { name: 'Estudios Sociales', source: 'DEPR Estándares de Contenido y Expectativas de Grado — Estudios Sociales (2022)' },
};

// Matches a standard code anywhere in the text — not anchored to line start.
//   group 1: grade (K or 1-12)
//   group 2: code body — domain (1-4 letters, optional 1-2 digits) + at least one .digit segment + optional letter suffix
// Examples: 4.N.1.7, K.CB1.10, 3.PLA.10.3, 2.LA.1.1h
const CODE_RE = /\b(K|[1-9]|1[0-2])\.([A-Z]{1,4}\d{0,2}(?:\.\d+)+[a-z]?)(?=[\s.,:;])/g;

const SKIP_PATTERNS = [
  /^\s*$/,
  /^Est[áa]ndares de Contenido y Expectativas/i,
  /^Content Standards and Grade Level Expectations/i,
  /^\s*[ivx]+\s*$/i,
  /^\s*\d+\s*$/,
  /^(KINDER|PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO|UND[EÉ]CIMO|DUOD[EÉ]CIMO)\s+GRADO\s*$/i,
  /^(KINDERGARTEN|FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH)\s+GRADE\s*$/i,
];

function shouldSkip(line) {
  return SKIP_PATTERNS.some(re => re.test(line));
}

function extractDomain(codeBody) {
  const m = codeBody.match(/^([A-Z]+)(\d+)?/);
  return m ? m[1] : codeBody.split('.')[0];
}

function cleanText(t) {
  return t
    .replace(/[   ]/g, ' ')  // NBSP variants
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

async function parseSubject(slug) {
  const file = path.join(RAW, `${slug}.txt`);
  const raw = await fs.readFile(file, 'utf8');

  // Concatenate all non-junk lines into a single blob
  const blob = raw
    .split(/\r?\n/)
    .filter(l => !shouldSkip(l.trim()))
    .join(' ')
    .replace(/[   ]/g, ' ')
    .replace(/\s+/g, ' ');

  // Walk every code match in order
  const matches = [...blob.matchAll(CODE_RE)];
  const out = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const grade = m[1];
    const codeBody = m[2];
    const code = `${grade}.${codeBody}`;
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : blob.length;
    const text = cleanText(blob.slice(start, end));
    if (text.length < 6) continue;
    out.push({
      code,
      subject: SUBJECTS[slug].name,
      grade,
      domain: extractDomain(codeBody),
      expectation: text,
      source: SUBJECTS[slug].source,
    });
  }
  return out;
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const s of list) {
    if (seen.has(s.code)) continue;
    seen.add(s.code);
    out.push(s);
  }
  return out;
}

function groupByGrade(list) {
  const byGrade = {};
  for (const s of list) {
    (byGrade[s.grade] ??= []).push(s);
  }
  return byGrade;
}

// Wipe old generated files first so renames stay clean
const existing = await fs.readdir(OUT);
for (const f of existing) {
  if (/^pr-(mat|cie|esp|ing|est)-(k|\d{1,2})\.json$/.test(f)) {
    await fs.unlink(path.join(OUT, f));
  }
}

const summary = [];
for (const slug of Object.keys(SUBJECTS)) {
  console.log(`\nParsing ${SUBJECTS[slug].name} (${slug})…`);
  const all = await parseSubject(slug);
  const unique = dedupe(all);
  const byGrade = groupByGrade(unique);
  for (const [grade, items] of Object.entries(byGrade)) {
    const gradeCode = grade.toLowerCase();
    const file = path.join(OUT, `pr-${slug}-${gradeCode}.json`);
    await fs.writeFile(file, JSON.stringify(items, null, 2), 'utf8');
    console.log(`  pr-${slug}-${gradeCode}.json  →  ${items.length} estándares`);
    summary.push({ slug, grade: gradeCode, count: items.length });
  }
}

console.log('\n────────── RESUMEN ──────────');
const bySlug = {};
for (const s of summary) {
  bySlug[s.slug] = (bySlug[s.slug] || 0) + s.count;
}
for (const [slug, count] of Object.entries(bySlug)) {
  console.log(`  ${SUBJECTS[slug].name.padEnd(20)} ${count} estándares`);
}
console.log(`  Total: ${summary.reduce((a, s) => a + s.count, 0)} en ${summary.length} archivos`);
