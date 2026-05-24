/* Single source of truth for fetching standards.
   Today: reads pr-{subject}-{grade}.json files from /standards.
   Tomorrow (Athenas API): swap loadAll() to fetch from the remote endpoint. */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, 'standards');

const SUBJECT_CODE = {
  'Matemáticas':       'mat',
  'Ciencias':          'cie',
  'Español':           'esp',
  'Español / Lenguaje':'esp',
  'Inglés':            'ing',
  'Inglés / ELA':      'ing',
  'Estudios Sociales': 'est',
  'Arte':              'art',
  'Música':            'mus',
};

const GRADE_CODE = (g) => {
  if (!g) return null;
  const s = String(g).toLowerCase();
  if (s === 'k' || s === 'kinder') return 'k';
  const m = s.match(/^(\d{1,2})/);
  return m ? m[1] : null;
};

let _cache = new Map();

async function loadFile(subject, grade) {
  const subj = SUBJECT_CODE[subject];
  const gr   = GRADE_CODE(grade);
  if (!subj || !gr) return [];
  const key  = `${subj}-${gr}`;
  if (_cache.has(key)) return _cache.get(key);
  const file = path.join(DIR, `pr-${subj}-${gr}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const arr = JSON.parse(raw);
    _cache.set(key, arr);
    return arr;
  } catch (err) {
    if (err.code === 'ENOENT') {
      _cache.set(key, []);
      return [];
    }
    throw err;
  }
}

export async function getStandards({ subject, grade, codes } = {}) {
  if (Array.isArray(codes) && codes.length) {
    // Need to search across all known files for arbitrary codes — but for now
    // require subject+grade if codes provided. Future: build an index across all.
    const list = await loadFile(subject, grade);
    return list.filter(s => codes.includes(s.code));
  }
  return loadFile(subject, grade);
}

export async function getAvailableSubjects(grade) {
  const subjects = [];
  for (const subj of Object.keys(SUBJECT_CODE)) {
    const list = await loadFile(subj, grade);
    if (list.length) subjects.push(subj);
  }
  return subjects;
}

export function clearCache() { _cache.clear(); }
