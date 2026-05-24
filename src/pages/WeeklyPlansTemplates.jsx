import React, { useState, useEffect, useMemo } from 'react';

const KIND_LABEL = {
  plan: 'Plan',
  presentation: 'Presentación',
  activity: 'Actividad',
  exam: 'Examen',
  quiz: 'Prueba corta',
  review: 'Repaso',
  other: 'Otro',
};

const KIND_COLOR = {
  plan:          { bg: '#E9F2FA', fg: '#27466C' },
  presentation:  { bg: '#FFE9D6', fg: '#A8521A' },
  activity:      { bg: '#DFF5E8', fg: '#246B49' },
  exam:          { bg: '#FBE3E2', fg: '#9D3835' },
  quiz:          { bg: '#FFF0D6', fg: '#B16C00' },
  review:        { bg: '#EEE9FF', fg: '#6745EA' },
  other:         { bg: '#F4F6F9', fg: '#6B7A93' },
};

export default function WeeklyPlansTemplates() {
  const [data,      setData]    = useState({ count: 0, facets: { subjects: [], scopes: [], kinds: [] }, plans: [] });
  const [loading,   setLoading] = useState(true);
  const [error,     setError]   = useState('');
  const [subject,   setSubject] = useState('');
  const [scope,     setScope]   = useState('');
  const [kind,      setKind]    = useState('plan');
  const [q,         setQ]       = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (scope)   params.set('scope', scope);
    if (kind)    params.set('kind', kind);
    fetch(`/api/weekly-plans?${params}`)
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [subject, scope, kind]);

  const filtered = useMemo(() => {
    if (!q.trim()) return data.plans;
    const term = q.toLowerCase();
    return data.plans.filter(p =>
      p.filename.toLowerCase().includes(term) ||
      (p.subject || '').toLowerCase().includes(term)
    );
  }, [data.plans, q]);

  const grouped = useMemo(() => {
    const g = {};
    for (const p of filtered) {
      const key = `${p.subject} · ${p.scope}${p.unit ? ` · U${p.unit}` : ''}`;
      (g[key] ??= []).push(p);
    }
    return g;
  }, [filtered]);

  return (
    <div className="wp-page">
      <header className="wp-head">
        <div>
          <div className="wp-eyebrow">Planificación</div>
          <h1>Plantillas y planes de tu distrito</h1>
          <p>
            {data.count.toLocaleString()} archivos disponibles del DEPR — planes, presentaciones, evaluaciones y actividades.
            Usa cualquiera como referencia o como base para crear tu propio plan con IA.
          </p>
        </div>
      </header>

      <div className="wp-filters">
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">Todas las materias</option>
          {data.facets.subjects.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="">Todos los grados</option>
          {data.facets.scopes.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Todo tipo de archivo</option>
          {data.facets.kinds.map(k => <option key={k} value={k}>{KIND_LABEL[k] || k}</option>)}
        </select>
        <input
          type="text"
          placeholder="Buscar por nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <div className="wp-error">Error: {error}</div>}
      {loading && <div className="wp-loading">Cargando…</div>}

      {!loading && filtered.length === 0 && (
        <div className="wp-empty">No hay archivos que coincidan con los filtros.</div>
      )}

      {Object.entries(grouped).map(([groupKey, items]) => (
        <section key={groupKey} className="wp-group">
          <h2>{groupKey} <span className="wp-group-count">{items.length}</span></h2>
          <div className="wp-grid">
            {items.map(p => {
              const c = KIND_COLOR[p.kind] || KIND_COLOR.other;
              return (
                <a
                  key={p.path}
                  className="wp-card"
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={p.filename}
                >
                  <div className="wp-card-kind" style={{ background: c.bg, color: c.fg }}>
                    {KIND_LABEL[p.kind] || p.kind}
                  </div>
                  <div className="wp-card-body">
                    <div className="wp-card-title">
                      U{p.unit}{p.week ? ` · S${p.week}` : ''}
                    </div>
                    <div className="wp-card-file">{p.filename}</div>
                  </div>
                  <div className="wp-card-ext">.{p.ext}</div>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
