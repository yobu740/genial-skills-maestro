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

function normalizeCurriculumText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const SUBJECT_ALIASES = {
  matematica: 'matematicas',
  matematicas: 'matematicas',
  math: 'matematicas',
  mathematics: 'matematicas',
  ciencias: 'ciencias',
  science: 'ciencias',
  sociales: 'estudios sociales',
  'estudios sociales': 'estudios sociales',
  'ciencias sociales': 'estudios sociales',
  'social studies': 'estudios sociales',
  ingles: 'ingles',
  english: 'ingles',
  ela: 'ingles',
  espanol: 'espanol',
  spanish: 'espanol',
  'artes del lenguaje': 'espanol',
};

function normalizeSubjectName(value) {
  const normalized = normalizeCurriculumText(value);
  return SUBJECT_ALIASES[normalized] || normalized;
}

function normalizeGradeCode(value) {
  return String(value || '').replace(/\D/g, '');
}

export default function WeeklyPlansTemplates() {
  const [data,      setData]    = useState({ count: 0, facets: { subjects: [], scopes: [], kinds: [] }, plans: [] });
  const [loading,   setLoading] = useState(true);
  const [error,     setError]   = useState('');
  const [subject,   setSubject] = useState('');
  const [scope,     setScope]   = useState('');
  const [kind,      setKind]    = useState('plan');
  const [q,         setQ]       = useState('');
  const [unit,      setUnit]    = useState('');
  const [units,     setUnits]   = useState([]);
  const [unitContext, setUnitContext] = useState(null);
  const [loadingUnits, setLoadingUnits] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (scope)   params.set('scope', scope);
    if (kind)    params.set('kind', kind);
    if (unit)    params.set('unit', unit);
    if (q)       params.set('q', q);
    fetch(`/api/weekly-plans?${params}`)
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [subject, scope, kind, unit, q]);

  useEffect(() => {
    setUnit('');
    setUnitContext(null);

    if (!subject || !scope) {
      setUnits([]);
      return;
    }

    setLoadingUnits(true);
    fetch('/data/units.json')
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar units.json');
        return res.json();
      })
      .then(json => {
        const selectedSubject = normalizeSubjectName(subject);
        const selectedGrade = normalizeGradeCode(scope);
        const filteredUnits = (json.units || []).filter(item => {
          const itemSubject = normalizeSubjectName(item.subject);
          const itemGrade = normalizeGradeCode(item.grade);
          return itemSubject === selectedSubject && itemGrade === selectedGrade;
        });
        setUnits(filteredUnits);
      })
      .catch(err => {
        console.error('Error loading curriculum units:', err);
        setUnits([]);
      })
      .finally(() => setLoadingUnits(false));
  }, [subject, scope]);

  const handleUnitChange = (unitId) => {
    setUnit(unitId);
    const selected = units.find(item => item.id === unitId || item.code === unitId);
    setUnitContext(selected || null);

    if (selected) {
      sessionStorage.setItem('selectedUnit', JSON.stringify(selected));
    } else {
      sessionStorage.removeItem('selectedUnit');
    }
  };

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
        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value)}
          disabled={!subject || !scope || loadingUnits}
          aria-label="Unidad curricular"
        >
          <option value="">
            {loadingUnits ? 'Cargando unidades...' : 'Todas las unidades'}
          </option>
          {units.map(item => (
            <option key={item.id} value={item.code}>
              Unidad {item.code}: {item.title}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar por nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {unitContext && (
        <section className="wp-unit-context" aria-label="Contexto de la unidad curricular">
          <div className="wp-unit-main">
            <div className="wp-unit-eyebrow">Contexto curricular</div>
            <h2>Unidad {unitContext.code}: {unitContext.title}</h2>
            <p>{unitContext.transferObjectives?.[0]}</p>
          </div>
          <div className="wp-unit-meta">
            <span>{unitContext.weeks} semanas</span>
            <span>Semanas {unitContext.startWeek}-{unitContext.endWeek}</span>
          </div>
          <div className="wp-unit-sections">
            {unitContext.essentialQuestions?.length > 0 && (
              <div>
                <h3>Preguntas esenciales</h3>
                <ul>
                  {unitContext.essentialQuestions.slice(0, 3).map((item, index) => (
                    <li key={index}>{item.question}</li>
                  ))}
                </ul>
              </div>
            )}
            {unitContext.acquisitionObjectives?.length > 0 && (
              <div>
                <h3>Destrezas</h3>
                <ul>
                  {unitContext.acquisitionObjectives.slice(0, 4).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {unitContext.standards?.length > 0 && (
              <div>
                <h3>Estándares PRCS</h3>
                <div className="wp-standards-tags">
                  {unitContext.standards.map((item, index) => (
                    <span key={index}>{item.code}</span>
                  ))}
                </div>
              </div>
            )}
            {unitContext.resources?.length > 0 && (
              <div>
                <h3>Recursos disponibles</h3>
                <ul>
                  {unitContext.resources.slice(0, 5).map((item, index) => (
                    <li key={index}>{item.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

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
