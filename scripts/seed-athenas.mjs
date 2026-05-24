// Convert the lessonsCatalog.js export into JSON files under /athenas-cache/.
// The backend's loadAthenasIndex() reads each .json file and groups by subject+grade.
import { FLAT_LESSONS } from './lessonsCatalog.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'athenas-cache');
await fs.mkdir(OUT, { recursive: true });

// Group by subjectCode + levelCode
const grouped = {};
for (const l of FLAT_LESSONS) {
  const key = `${l.SubjectCode}-${l.LevelCode}`;
  (grouped[key] ??= []).push({
    Id: l.Id,
    LessonNo: l.LessonNo,
    LessonTitle: l.LessonTitle,
    SubjectCode: l.SubjectCode,
    LevelCode: l.LevelCode,
    std: l.Standards?.[0]?.Code || null,
    Objective: l.Standards?.[0]?.Description || '',
    IsGapClosing: l.IsGapClosing,
    Blueprint: l.Blueprint,
    Definitions: l.Definitions,
  });
}

// Wipe any old generated files
const existing = await fs.readdir(OUT);
for (const f of existing) {
  if (f.startsWith('lessons-') && f.endsWith('.json')) await fs.unlink(path.join(OUT, f));
}

// Write one file per group
for (const [key, lessons] of Object.entries(grouped)) {
  const file = path.join(OUT, `lessons-${key}.json`);
  await fs.writeFile(file, JSON.stringify(lessons, null, 2), 'utf8');
  console.log(`  lessons-${key}.json  →  ${lessons.length} lecciones`);
}

console.log(`\nDone. ${FLAT_LESSONS.length} lecciones en ${Object.keys(grouped).length} archivos.`);
