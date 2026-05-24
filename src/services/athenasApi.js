/**
 * Athenas / baseapi service.
 *
 * All upstream calls go through our Express proxy at /api/athenas/* (avoids CORS
 * and keeps the token off third-party origins). The teacher's JWT lives in
 * localStorage.auth.Token — set automatically when the prototype is embedded
 * in maestros.genialskillsweb.com, or manually for testing:
 *
 *   localStorage.setItem('auth', JSON.stringify({ Token: '<paste-jwt>' }))
 *
 * Each function returns { ..., fromMock: bool } so callers can render a
 * "Live API" vs "Cache" badge without re-fetching.
 */

export function getAthenasToken() {
  try {
    return JSON.parse(localStorage.getItem('auth') || '{}').Token || null;
  } catch { return null; }
}

export function hasAthenasToken() { return !!getAthenasToken(); }

const TOKEN_HEADER = (token) => ({ 'x-athenas-token': token });

/* ─────────── Search lessons ─────────── */
export async function searchLessons({
  subjectCodes = [], levelCodes = [], text = '', page = 0, limit = 12,
  signal,
} = {}) {
  const token = getAthenasToken();
  if (!token) return localCacheSearch({ subjectCodes, levelCodes, text, page, limit });

  try {
    const r = await fetch('/api/athenas/lessons/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...TOKEN_HEADER(token) },
      body: JSON.stringify({ subjectCodes, levelCodes, text, page, limit }),
      signal,
    });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
    if (j.fromMock) return localCacheSearch({ subjectCodes, levelCodes, text, page, limit });
    // Normalize: API returns objects with LessonModel + LessonStandardModelList nesting
    const lessons = (j.lessons || []).map(L => ({
      Id:          L.LessonModel?.Id,
      LessonNo:    L.LessonModel?.LessonNo,
      LevelCode:   L.LessonModel?.LevelCode,
      SubjectCode: L.LessonModel?.SubjectCode,
      LessonTitle: L.LessonModel?.LessonTitle,
      IsGapClosing: L.LessonModel?.IsGapClosing,
      Blueprint:   L.LessonModel?.Blueprint,
      Standards:   L.LessonStandardModelList || [],
      Definitions: (L.LessonDefinitionModelList || []).length,
    }));
    return { lessons, total: j.total, fromMock: false };
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    console.warn('[athenasApi] live search failed, falling back to cache:', e.message);
    return localCacheSearch({ subjectCodes, levelCodes, text, page, limit });
  }
}

/* ─────────── Single lesson detail ─────────── */
export async function getLessonDetail(lessonId) {
  const token = getAthenasToken();
  if (!token) return null;
  try {
    const r = await fetch(`/api/athenas/lessons/${encodeURIComponent(lessonId)}`, {
      headers: TOKEN_HEADER(token),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

/* ─────────── Subjects / Grades ─────────── */
export async function getSubjects() {
  const token = getAthenasToken();
  if (!token) return { subjects: FALLBACK_SUBJECTS, fromMock: true };
  try {
    const r = await fetch('/api/athenas/subjects', { headers: TOKEN_HEADER(token) });
    const j = await r.json();
    if (j.fromMock || !j.subjects?.length) return { subjects: FALLBACK_SUBJECTS, fromMock: true };
    return { subjects: j.subjects, fromMock: false };
  } catch { return { subjects: FALLBACK_SUBJECTS, fromMock: true }; }
}

export async function getGrades() {
  const token = getAthenasToken();
  if (!token) return { grades: FALLBACK_GRADES, fromMock: true };
  try {
    const r = await fetch('/api/athenas/grades', { headers: TOKEN_HEADER(token) });
    const j = await r.json();
    if (j.fromMock || !j.grades?.length) return { grades: FALLBACK_GRADES, fromMock: true };
    return { grades: j.grades, fromMock: false };
  } catch { return { grades: FALLBACK_GRADES, fromMock: true }; }
}

/* ─────────── Local cache fallback (uses our /api/athenas-lessons) ─────────── */
async function localCacheSearch({ subjectCodes, levelCodes, text, page, limit }) {
  try {
    const params = new URLSearchParams();
    if (subjectCodes[0]) params.set('subject', subjectCodes[0]);
    if (levelCodes[0])   params.set('grade',   levelCodes[0]);
    if (text)            params.set('q',       text);
    const r = await fetch(`/api/athenas-lessons?${params}`);
    const j = await r.json();
    const all = j.lessons || [];
    const sliced = all.slice(page * limit, (page + 1) * limit);
    return {
      lessons: sliced.map(l => ({
        Id: l.id, LessonNo: l.LessonNo, LevelCode: l.levelCode,
        SubjectCode: l.subjectCode, LessonTitle: l.title,
        Standards: l.standard ? [{ Code: l.standard, Description: l.objective || '' }] : [],
        Definitions: l.Definitions || 0,
      })),
      total: all.length,
      fromMock: true,
    };
  } catch {
    return { lessons: [], total: 0, fromMock: true };
  }
}

/* ─────────── Fallbacks (static) ─────────── */
const FALLBACK_SUBJECTS = [
  { Code: 'sp',     Name: 'Español' },
  { Code: 'mat-sp', Name: 'Matemáticas' },
  { Code: 'sci-sp', Name: 'Ciencias' },
  { Code: 'sci-so', Name: 'Estudios Sociales' },
  { Code: 'en',     Name: 'English' },
  { Code: 'mat-en', Name: 'Math (English)' },
  { Code: 'sci-en', Name: 'Science (English)' },
  { Code: 'bi-sp',  Name: 'Biología' },
  { Code: 'qu-sp',  Name: 'Química' },
  { Code: 'a1-sp',  Name: 'Álgebra I' },
  { Code: 'geo-sp', Name: 'Geometría' },
];

const FALLBACK_GRADES = [
  { Code: 'k',  Name: 'K' },  { Code: '1',  Name: '1' },
  { Code: '2',  Name: '2' },  { Code: '3',  Name: '3' },
  { Code: '4',  Name: '4' },  { Code: '5',  Name: '5' },
  { Code: '6',  Name: '6' },  { Code: '7',  Name: '7' },
  { Code: '8',  Name: '8' },  { Code: '9',  Name: '9' },
  { Code: '10', Name: '10' }, { Code: '11', Name: '11' }, { Code: '12', Name: '12' },
];

/* ─────────── Simple debouncer ─────────── */
export function debounce(fn, ms = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
