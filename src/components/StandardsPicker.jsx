import React, { useState, useEffect, useMemo, useRef } from 'react';

/**
 * StandardsPicker — fetches DEPR standards for the given subject + grade
 * and lets the teacher multi-select. Returns the selected standards
 * (full objects) via onChange.
 *
 * Props:
 *   subject:  string (e.g. "Matemáticas")
 *   grade:    string (e.g. "5to", "K")
 *   value:    array of selected standard objects
 *   onChange: (selectedArray) => void
 */
export default function StandardsPicker({ subject, grade, value = [], onChange }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');
  const [q, setQ]           = useState('');
  const [expanded, setExp]  = useState(false);
  const abortRef = useRef(null);

  // Fetch when subject + grade change
  useEffect(() => {
    if (!subject || !grade) {
      setItems([]);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoad(true);
    setError('');
    fetch(`/api/standards?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(json => {
        setItems(json.standards || []);
        setLoad(false);
      })
      .catch(e => {
        if (e.name !== 'AbortError') { setError(String(e)); setLoad(false); }
      });
  }, [subject, grade]);

  // Clear selections when subject/grade changes (selected may not exist in new set)
  useEffect(() => {
    if (value.length) onChange?.([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, grade]);

  const selectedCodes = useMemo(() => new Set(value.map(s => s.code)), [value]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const term = q.toLowerCase();
    return items.filter(s =>
      s.code.toLowerCase().includes(term) ||
      s.expectation.toLowerCase().includes(term) ||
      (s.domain || '').toLowerCase().includes(term)
    );
  }, [items, q]);

  // Group filtered standards by domain for visual structure
  const grouped = useMemo(() => {
    const g = {};
    for (const s of filtered) {
      (g[s.domain || '—'] ??= []).push(s);
    }
    return g;
  }, [filtered]);

  function toggle(std) {
    const codes = new Set(value.map(s => s.code));
    if (codes.has(std.code)) onChange?.(value.filter(s => s.code !== std.code));
    else onChange?.([...value, std]);
  }

  function clear() { onChange?.([]); }

  // When neither subject nor grade are set (and there's no way to set them
  // from the parent form) the picker can't do anything useful — render nothing
  // so the user doesn't get an unsatisfiable "Elige materia y grado" warning
  // in tools that don't expose those fields.
  if (!subject && !grade) return null;

  // Only one of (subject, grade) is set — show a focused hint about what's still missing.
  if (!subject || !grade) {
    const missing = !subject ? 'materia' : 'grado';
    return (
      <div className="sp-hint">
        Elige <b>{missing}</b> arriba para cargar los estándares DEPR.
      </div>
    );
  }

  return (
    <div className={`sp ${expanded ? 'expanded' : ''}`}>
      <div className="sp-head">
        <button
          type="button"
          className="sp-toggle"
          onClick={() => setExp(e => !e)}
          aria-expanded={expanded}
        >
          <span className={`sp-chev ${expanded ? 'open' : ''}`}>▸</span>
          <span>Estándares DEPR aplicables</span>
          {value.length > 0 && <span className="sp-count">{value.length}</span>}
          {loading && <span className="sp-loading" />}
        </button>
        {value.length > 0 && (
          <button type="button" className="sp-clear" onClick={clear}>Limpiar</button>
        )}
      </div>

      {expanded && (
        <div className="sp-body">
          {error ? (
            <div className="sp-error">Error: {error}</div>
          ) : items.length === 0 && !loading ? (
            <div className="sp-empty">
              No hay estándares para <b>{subject}</b> en <b>{grade}</b>.
            </div>
          ) : (
            <>
              <div className="sp-search">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`Buscar entre ${items.length} estándares de ${subject} · ${grade}…`}
                />
              </div>

              {value.length > 0 && (
                <div className="sp-selected">
                  {value.map(s => (
                    <button
                      type="button"
                      key={s.code}
                      className="sp-chip"
                      onClick={() => toggle(s)}
                      title={s.expectation}
                    >
                      {s.code} ×
                    </button>
                  ))}
                </div>
              )}

              <div className="sp-list" role="listbox">
                {Object.entries(grouped).map(([domain, list]) => (
                  <div key={domain} className="sp-group">
                    <div className="sp-group-head">{domain}  <span className="sp-group-count">{list.length}</span></div>
                    {list.map(s => {
                      const checked = selectedCodes.has(s.code);
                      return (
                        <label key={s.code} className={`sp-item ${checked ? 'on' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(s)}
                          />
                          <span className="sp-code">{s.code}</span>
                          <span className="sp-exp">{s.expectation}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="sp-empty">No hay resultados para "{q}".</div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
