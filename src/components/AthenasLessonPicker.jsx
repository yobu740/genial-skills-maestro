import React, { useState, useEffect, useRef } from 'react';
import { searchLessons, getLessonDetail, normalizeGrade, normalizeSubject } from '../services/athenasApi.js';

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
  const [picking,  setPicking]  = useState('');   // lesson Id currently loading detail

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

  // Metadata-only fallback shape (lowercase keys) in case the detail call fails.
  function basicShape(l) {
    return {
      id: l.Id, title: l.LessonTitle, lessonNo: l.LessonNo,
      subjectCode: l.SubjectCode, levelCode: l.LevelCode,
      blueprint: l.Blueprint === '1', isGapClosing: l.IsGapClosing === '1',
      standards: [], definitions: [], description: '', objectives: [],
      examples: [], performanceTasks: [], strategies: [], themes: [],
    };
  }

  async function handlePick(l) {
    setPicking(String(l.Id));
    try {
      const detail = await getLessonDetail(l.Id);
      onPick?.(detail && detail.title ? detail : basicShape(l));
    } catch {
      onPick?.(basicShape(l));
    } finally {
      setPicking('');
      setOpen(false);
    }
  }

  return (
    <>
      <button type="button" className="tm-upload-btn" onClick={() => setOpen(true)}>
        📚 Elegir Contenido
      </button>
      {open && (
        <div className="alp-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="alp-modal" role="dialog">
            <header className="alp-head">
              <div>
                <h3>
                  Catálogo de contenido
                  <span className={`alp-badge ${fromMock ? 'cache' : 'live'}`} title={fromMock ? 'Usando cache local — elige materia y grado' : 'Live: athenasapi (X-API-KEY)'}>
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
                  <small>Elige una <strong>materia</strong> y un <strong>grado</strong> para ver el catálogo de Athenas.</small>
                </div>
              )}
              {items.map(l => (
                <button
                  key={l.Id || l.LessonTitle}
                  type="button"
                  className="alp-item"
                  disabled={!!picking}
                  onClick={() => handlePick(l)}
                >
                  <div className="alp-item-title">
                    {l.LessonTitle}
                    {picking === String(l.Id) && <span className="alp-loading"> · cargando…</span>}
                  </div>
                  <div className="alp-item-meta">
                    {l.LessonNo && <span>Lección {l.LessonNo}</span>}
                    <span>{l.SubjectCode}</span>
                    <span>·</span>
                    <span>Grado {l.LevelCode}</span>
                    {l.Blueprint === '1' && <span className="alp-bp">📐 Blueprint</span>}
                    {l.IsGapClosing === '1' && <span className="alp-gc">🌉 Gap closing</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
