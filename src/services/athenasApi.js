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

/**
 * Normalize display grade strings like "5to", "1ro", "K", "k" to the Athenas
 * code format which is just the digit or lowercase "k".
 */
export function normalizeGrade(g) {
  if (g == null) return '';
  const s = String(g).trim().toLowerCase();
  if (s === 'k' || s === 'kinder' || s === 'kindergarten') return 'k';
  const m = s.match(/^(\d{1,2})/);
  return m ? m[1] : s;
}

/**
 * Translate a display subject name (or already-code value) to the Athenas
 * subjectCode used by the API. Returns an array because one display name can
 * fan out to multiple codes (e.g. "Ciencias" → sci-sp + bi-sp + qu-sp + fi-sp).
 *   "Matemáticas"        → ["mat-sp", "mat-en"]
 *   "mat-sp"             → ["mat-sp"]  (passthrough if it's already a code)
 *   "Español / Lenguaje" → ["sp"]
 */
const SUBJECT_NAME_TO_CODES = {
  'matemáticas':       ['mat-sp', 'mat-en'],
  'matematicas':       ['mat-sp', 'mat-en'],
  'matemática':        ['mat-sp', 'mat-en'],
  'matematica':        ['mat-sp', 'mat-en'],
  'math':              ['mat-en', 'mat-sp'],
  'ciencias':          ['sci-sp', 'sci-en', 'bi-sp', 'qu-sp', 'fi-sp'],
  'ciencias naturales':['sci-sp'],
  'science':           ['sci-en', 'sci-sp'],
  'español':           ['sp'],
  'espanol':           ['sp'],
  'español / lenguaje':['sp'],
  'lenguaje':          ['sp'],
  'inglés':            ['en'],
  'ingles':            ['en'],
  'inglés / ela':      ['en'],
  'english':           ['en'],
  'ela':               ['en'],
  'estudios sociales': ['sci-so'],
  'social studies':    ['sci-so'],
  'biología':          ['bi-sp'],
  'biologia':          ['bi-sp'],
  'biology':           ['bi-en', 'bi-sp'],
  'química':           ['qu-sp'],
  'quimica':           ['qu-sp'],
  'chemistry':         ['che-en', 'qu-sp'],
  'física':            ['fi-sp'],
  'fisica':            ['fi-sp'],
  'physics':           ['phy-en', 'fi-sp'],
  'álgebra':           ['a1-sp', 'a2'],
  'algebra':           ['a1-sp', 'a2'],
  'álgebra i':         ['a1-sp'],
  'álgebra ii':        ['a2'],
  'geometría':         ['geo-sp'],
  'geometria':         ['geo-sp'],
  'precalculus':       ['pc-en'],
  'precálculo':        ['pc-en'],
};

export function normalizeSubject(s) {
  if (!s) return [];
  const key = String(s).trim().toLowerCase();
  // Already a code? (contains hyphen or short like "sp"/"en")
  if (/^[a-z0-9]{1,3}(-[a-z0-9]+)?$/.test(key)) return [key];
  return SUBJECT_NAME_TO_CODES[key] || [];
}

/* ─────────── Search lessons ─────────── */
export async function searchLessons({
  subjectCodes = [], levelCodes = [], text = '', page = 0, limit = 12,
  signal,
} = {}) {
  // Normalize so callers can pass display strings ("Matemáticas", "5to") or codes.
  levelCodes = (levelCodes || []).map(normalizeGrade).filter(Boolean);
  subjectCodes = (subjectCodes || []).flatMap(normalizeSubject).filter(Boolean);
  subjectCodes = [...new Set(subjectCodes)];

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
    // Normalize: keep the full Standards + Definitions arrays so consumers
    // can render the real lesson content (not just title metadata).
    const lessons = (j.lessons || []).map(L => ({
      Id:           L.LessonModel?.Id,
      LessonNo:     L.LessonModel?.LessonNo,
      LevelCode:    L.LessonModel?.LevelCode,
      SubjectCode:  L.LessonModel?.SubjectCode,
      LessonTitle:  L.LessonModel?.LessonTitle,
      IsGapClosing: L.LessonModel?.IsGapClosing,
      Blueprint:    L.LessonModel?.Blueprint,
      Standards:    L.LessonStandardModelList || [],
      Definitions:  L.LessonDefinitionModelList || [],
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
