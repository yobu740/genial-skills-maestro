import React, { useState, useEffect, useRef } from 'react';
import { searchLessons, getSubjects, hasAthenasToken, normalizeGrade, normalizeSubject } from '../services/athenasApi.js';

const FALLBACK_SUBJECT_OPTIONS = [
  { Code: 'sp',     Name: 'Español' },
  { Code: 'mat-sp', Name: 'Matemáticas' },
  { Code: 'sci-sp', Name: 'Ciencias' },
  { Code: 'sci-so', Name: 'Estudios Sociales' },
  { Code: 'en',     Name: 'English' },
  { Code: 'mat-en', Name: 'Math (English)' },
  { Code: 'sci-en', Name: 'Science (English)' },
  { Code: 'bi-sp',  Name: 'Biología' },
  { Code: 'qu-sp',  Name: 'Química' },
  { Code: 'fi-sp',  Name: 'Física' },
  { Code: 'a1-sp',  Name: 'Álgebra I' },
  { Code: 'a2',     Name: 'Álgebra II' },
  { Code: 'geo-sp', Name: 'Geometría' },
];

const GRADE_OPTIONS = ['k', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

/**
 * AthenasLessonPicker — searches the Athenas catalog (live API when there's a
 * JWT in localStorage.auth.Token, otherwise falls back to the local cache).
 *
 * Props (all optional; whatever isn't provided becomes a dropdown in the modal):
 *   subject:  string  — display name ("Ciencias") or code ("sci-sp")
 *   grade:    string  — "5to" or "5" or "K"
 *   onPick:   (lesson) => void
 */
export default function AthenasLessonPicker({ subject: subjectProp, grade: gradeProp, onPick }) {
  const [open,     setOpen]     = useState(false);
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [q,        setQ]        = useState('');
  const [fromMock, setFromMock] = useState(false);

  // Internal filters — initialized from props, but editable by the user
  const [subject, setSubject]   = useState('');
  const [grade,   setGrade]     = useState('');
  const [subjectOptions, setSubjectOptions] = useState(FALLBACK_SUBJECT_OPTIONS);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync internal state when the modal opens or when props change
  useEffect(() => {
    if (!open) return;
    // For subject, normalize prop and pick the first matching code; otherwise empty
    const codes = normalizeSubject(subjectProp || '');
    setSubject(codes[0] || '');
    setGrade(normalizeGrade(gradeProp || ''));
  }, [open, subjectProp, gradeProp]);

  // Fetch live subjects list once the modal opens (only if we have a token)
  useEffect(() => {
    if (!open || !hasAthenasToken()) return;
    let cancelled = false;
    getSubjects().then(({ subjects, fromMock }) => {
      if (cancelled) return;
      if (!fromMock && Array.isArray(subjects) && subjects.length) {
        setSubjectOptions(subjects);
      }
    });
    return () => { cancelled = true; };
  }, [open]);

  // Run search whenever filters change
  useEffect(() => {
    if (!open) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    clearTimeout(debounceRef.current);
    const delay = q ? 400 : 0;
    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const r = await searchLessons({
          subjectCodes: subject ? [subject] : [],
          levelCodes:   grade   ? [grade]   : [],
          text: q, page: 0, limit: 30,
          signal: ctrl.signal,
        });
        setItems(r.lessons);
        setTotal(r.total);
        setFromMock(!!r.fromMock);
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(debounceRef.current);
  }, [open, subject, grade, q]);

  function handlePick(lesson) {
    onPick?.(lesson);
    setOpen(false);
  }

  return (
    <>
      <button type="button" className="tm-upload-btn" onClick={() => setOpen(true)}>
        📚 Elegir de Athenas
      </button>
      {open && (
        <div className="alp-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="alp-modal" role="dialog">
            <header className="alp-head">
              <div>
                <h3>
                  Catálogo de lecciones Athenas
                  <span className={`alp-badge ${fromMock ? 'cache' : 'live'}`} title={fromMock ? 'Usando cache local — no hay JWT' : 'Live: baseapi.genialskillsweb.com'}>
                    {fromMock ? '⚫ Cache' : '🟢 API Live'}
                  </span>
                </h3>
                <p>
                  {loading
                    ? 'Cargando…'
                    : `${total.toLocaleString()} lecciones disponibles`}
                </p>
              </div>
              <button type="button" className="alp-close" onClick={() => setOpen(false)}>×</button>
            </header>

            {/* Filters — subject + grade dropdowns always visible so user can refine */}
            <div className="alp-filters">
              <label className="alp-filter">
                <span>Materia</span>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">Todas</option>
                  {subjectOptions.map(s => (
                    <option key={s.Code} value={s.Code}>{s.Name} ({s.Code})</option>
                  ))}
                </select>
              </label>
              <label className="alp-filter">
                <span>Grado</span>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="">Todos</option>
                  {GRADE_OPTIONS.map(g => (
                    <option key={g} value={g}>{g.toUpperCase() === 'K' ? 'K' : g}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="alp-search">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título, objetivo o estándar…"
                autoFocus
              />
            </div>
            <div className="alp-list">
              {error && <div className="alp-error">Error: {error}</div>}
              {!loading && items.length === 0 && !error && (
                <div className="alp-empty">
                  No hay lecciones que coincidan con los filtros.<br/>
                  {!hasAthenasToken() && (
                    <small>
                      Para usar la API real, setea el token en consola del browser:<br/>
                      <code>localStorage.setItem('auth', JSON.stringify({'{'} Token: '...JWT...' {'}'}))</code>
                    </small>
                  )}
                </div>
              )}
              {items.map(l => (
                <button
                  key={l.Id || l.LessonTitle}
                  type="button"
                  className="alp-item"
                  onClick={() => handlePick({
                    // normalize for parent consumers
                    id:          l.Id,
                    title:       l.LessonTitle,
                    standard:    l.Standards?.[0]?.Code || null,
                    objective:   l.Standards?.[0]?.Description || '',
                    subjectCode: l.SubjectCode,
                    levelCode:   l.LevelCode,
                  })}
                >
                  <div className="alp-item-title">{l.LessonTitle}</div>
                  <div className="alp-item-meta">
                    {l.Standards?.[0]?.Code && <span className="alp-std">{l.Standards[0].Code}</span>}
                    <span>{l.SubjectCode}</span>
                    <span>·</span>
                    <span>Grado {l.LevelCode}</span>
                    {l.Blueprint === '1' && <span className="alp-bp">📐 Blueprint</span>}
                    {l.IsGapClosing === '1' && <span className="alp-gc">🌉 Gap closing</span>}
                  </div>
                  {l.Standards?.[0]?.Description && <div className="alp-item-obj">{l.Standards[0].Description.slice(0, 200)}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
