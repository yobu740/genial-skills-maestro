/**
 * Index all weekly lesson plans into a single JSON for fast lookup.
 * Walks all known folders, parses filename conventions, deduplicates,
 * and writes weekly-plans-index.json.
 *
 * Filename conventions observed:
 *   - "EDU-FIS 3-5.U4.S1 ACTIVIDADESDEAPLICACIONES1Y2.docx"
 *   - "ENGLISH 1.U2.W1 PLAN.pdf"
 *   - "BA-ARTES 4-8.U1.S1 PLAN.pdf"
 *   - "ESTUDIOS-SOC 5.U3.S2 PRESENTACION.pptx"
 *
 * Structure: { SUBJECT_PREFIX SCOPE }.U{unit}.{S|W}{week} {KIND}.{ext}
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ROOTS = [
  'Planes semanales',
  'BELLAS ARTES-Planes semanales-20260521T025922Z-3-001',
  'Estudios sociales-Planes semanales',
];

// Map subject prefixes (from filename) → display name
const SUBJECT_MAP = {
  'EDU-FIS':       'Educación Física',
  'ENGLISH':       'Inglés',
  'MATE':          'Matemáticas',
  'MAT':           'Matemáticas',
  'MATH':          'Matemáticas',
  'CIENCIAS':      'Ciencias',
  'ESPANOL':       'Español',
  'ADQLENGUA':     'Español',
  'SOCIALES':      'Estudios Sociales',
  'SALUD':         'Salud',
  'BA-ARTES':      'Artes Visuales',
  'BA-MUSICA':     'Música',
  'BA-DANZA':      'Danza',
  'BA-TEATRO':     'Teatro',
  'BA-COMU':       'Comunicaciones',
  'DANZA':         'Danza',
  'BA':            'Bellas Artes',
};

// KIND mapping for display
const KIND_MAP = {
  'PLAN':                            { type: 'plan',         label: 'Plan de lección' },
  'PRESENTACION':                    { type: 'presentation', label: 'Presentación' },
  'PRESENTATION':                    { type: 'presentation', label: 'Presentación' },
  'ACTIVIDADESDEAPLICACIONES1Y2':    { type: 'activity',     label: 'Actividades de aplicación' },
  'ACTIVIDADESDEAPLICACIONES':       { type: 'activity',     label: 'Actividades de aplicación' },
  'IMPLEMENTATIONACTIVITIES1&2':     { type: 'activity',     label: 'Implementation activities' },
  'EXAMENDEUNIDAD':                  { type: 'exam',         label: 'Examen de unidad' },
  'PRUEBACORTA1':                    { type: 'quiz',         label: 'Prueba corta 1' },
  'PRUEBACORTA2':                    { type: 'quiz',         label: 'Prueba corta 2' },
  'REPASODEUNIDAD':                  { type: 'review',       label: 'Repaso de unidad' },
};

// Regex to parse the filename
// Example: "EDU-FIS 3-5.U4.S1 PRESENTACION.pptx"
//          group1 = subject prefix    "EDU-FIS"
//          group2 = scope (grade)     "3-5"
//          group3 = unit              "4"
//          group4 = week prefix       "S"  (S=Semana, W=Week)
//          group5 = week number       "1"
//          group6 = KIND              "PRESENTACION"
//          group7 = ext               "pptx"
const NAME_RE = /^([A-Z]+(?:-[A-Z]+)?)\s+([0-9KP]+(?:-[0-9]+)?)\.U(\d+)\.([SW])(\d+)\s+([A-Z0-9&]+)\.(pdf|docx|pptx)$/i;

// Also catch simpler forms without week (unit-level files like EXAMENDEUNIDAD)
// "EDU-FIS 3-5.U4 EXAMENDEUNIDAD.docx"
const UNIT_LEVEL_RE = /^([A-Z]+(?:-[A-Z]+)?)\s+([0-9KP]+(?:-[0-9]+)?)\.U(\d+)\s+([A-Z0-9&]+)\.(pdf|docx|pptx)$/i;

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch { return files; }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(p, files);
    else if (/\.(pdf|docx|pptx)$/i.test(ent.name)) files.push(p);
  }
  return files;
}

function parseFile(absPath) {
  const filename = path.basename(absPath);
  let m = filename.match(NAME_RE);
  let weekN = null;
  let kind = null;
  let unitN = null;
  let subjectPrefix = null;
  let scope = null;
  let ext = null;

  if (m) {
    [, subjectPrefix, scope, unitN, , weekN, kind, ext] = m;
  } else {
    m = filename.match(UNIT_LEVEL_RE);
    if (m) {
      [, subjectPrefix, scope, unitN, kind, ext] = m;
    } else {
      return null;
    }
  }

  const subject = SUBJECT_MAP[subjectPrefix.toUpperCase()] || subjectPrefix;
  const kindInfo = KIND_MAP[kind?.toUpperCase()] || { type: 'other', label: kind };

  return {
    subject,
    scope,                                   // grade range as string ("3-5", "1", "5", "K")
    unit: Number(unitN),
    week: weekN ? Number(weekN) : null,
    kind: kindInfo.type,
    kindLabel: kindInfo.label,
    ext: ext.toLowerCase(),
    filename,
    path: path.relative(ROOT, absPath).replace(/\\/g, '/'),
  };
}

console.log('Walking all weekly plans folders…');
let all = [];
for (const r of ROOTS) {
  const files = await walk(path.join(ROOT, r));
  console.log(`  ${r}: ${files.length} files`);
  for (const f of files) {
    const parsed = parseFile(f);
    if (parsed) all.push(parsed);
  }
}

// Dedupe by (subject, scope, unit, week, kind, filename)
const seen = new Set();
all = all.filter(p => {
  const key = `${p.subject}|${p.scope}|${p.unit}|${p.week}|${p.kind}|${p.filename}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Sort: subject, scope, unit, week, kind
all.sort((a, b) =>
  (a.subject || '').localeCompare(b.subject || '') ||
  (a.scope   || '').localeCompare(b.scope   || '') ||
  (a.unit    || 0) - (b.unit    || 0) ||
  (a.week    || 0) - (b.week    || 0) ||
  (a.kind    || '').localeCompare(b.kind    || '')
);

await fs.writeFile(
  path.join(ROOT, 'weekly-plans-index.json'),
  JSON.stringify(all, null, 2),
  'utf8',
);

// Summary by subject + kind
const bySub = {};
const byKind = {};
for (const p of all) {
  bySub[p.subject] = (bySub[p.subject] || 0) + 1;
  byKind[p.kind]   = (byKind[p.kind] || 0) + 1;
}
console.log(`\nIndexed ${all.length} unique files.`);
console.log('  By subject:');
for (const [k, v] of Object.entries(bySub).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${k.padEnd(22)} ${v}`);
}
console.log('  By kind:');
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${k.padEnd(14)} ${v}`);
}
console.log('\nWrote weekly-plans-index.json');
