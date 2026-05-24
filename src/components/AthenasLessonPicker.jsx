import React, { useState, useEffect, useMemo, useRef } from 'react';

/**
 * AthenasLessonPicker — searches the local Athenas lessons cache.
 * Picks a single lesson; calling onChange(lesson) fills the textarea
 * in the parent with the lesson's title + objective + standard.
 *
 * Props:
 *   subject:  string  (passed to filter by subjectCode)
 *   grade:    string  (passed to filter by levelCode)
 *   onPick:   (lesson) => void  — called when teacher picks one
 */
export default function AthenasLessonPicker({ subject, grade, onPick }) {
  const [open,    setOpen]    = useState(false);
  const [items,   setItems]   = useState([]);
  const [count,   setCount]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [q,       setQ]       = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setError('');
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (grade)   params.set('grade', grade);
    if (q)       params.set('q', q);
    fetch(`/api/athenas-lessons?${params}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(j => { setItems(j.lessons || []); setCount(j.count || 0); setLoading(false); })
      .catch(e => { if (e.name !== 'AbortError') { setError(String(e)); setLoading(false); }});
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
                <h3>Catálogo de lecciones Athenas</h3>
                <p>{loading ? 'Cargando…' : `${count.toLocaleString()} lecciones disponibles${subject ? ` para ${subject}` : ''}${grade ? ` · ${grade}` : ''}`}</p>
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
                  No hay lecciones en el cache para esta combinación.<br/>
                  <small>
                    El maestro o admin puede agregar JSONs en <code>/athenas-cache/</code> con el formato descrito en su README.
                  </small>
                </div>
              )}
              {items.map(l => (
                <button
                  key={l.id || l.title}
                  type="button"
                  className="alp-item"
                  onClick={() => handlePick(l)}
                >
                  <div className="alp-item-title">{l.title}</div>
                  <div className="alp-item-meta">
                    {l.standard && <span className="alp-std">{l.standard}</span>}
                    <span>{l.subjectCode}</span>
                    <span>·</span>
                    <span>Grado {l.levelCode}</span>
                  </div>
                  {l.objective && <div className="alp-item-obj">{l.objective.slice(0, 200)}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
