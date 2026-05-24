import React, { useState, useEffect, useRef } from 'react';
import { searchLessons, hasAthenasToken, normalizeGrade, normalizeSubject } from '../services/athenasApi.js';

/**
 * AthenasLessonPicker — searches the Athenas catalog (live API when there's a
 * JWT in localStorage.auth.Token, otherwise falls back to the local cache).
 *
 * Props:
 *   subject:  string  (Athenas subjectCode like "sci-sp")
 *   grade:    string  (levelCode like "5" or "k")
 *   onPick:   (lesson) => void
 */
export default function AthenasLessonPicker({ subject, grade, onPick }) {
  const [open,     setOpen]     = useState(false);
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [q,        setQ]        = useState('');
  const [fromMock, setFromMock] = useState(false);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    clearTimeout(debounceRef.current);
    // debounce text input; subject/grade changes are immediate
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
                    : `${total.toLocaleString()} lecciones disponibles${
                        subject ? ` para ${subject} (${normalizeSubject(subject).join('/') || '?'})` : ''
                      }${grade ? ` · grado ${normalizeGrade(grade) || grade}` : ''}`}
                </p>
              </div>
              <button type="button" className="alp-close" onClick={() => setOpen(false)}>×</button>
            </header>
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
