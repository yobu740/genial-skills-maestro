import React, { useState, useMemo } from 'react';
import { TOOLS } from '../data/toolsConfig.js';
import ToolModal from '../components/ToolModal.jsx';
import Ic from '../components/Icons.jsx';

const CATEGORIES = [
  { id: 'all',            label: 'Todas' },
  { id: 'planificacion',  label: 'Planificación' },
  { id: 'diferenciacion', label: 'Diferenciación' },
  { id: 'evaluacion',     label: 'Evaluación' },
  { id: 'lectura',        label: 'Lectura' },
  { id: 'asistentes',     label: 'Asistentes' },
];

// Map category → soft background tint for the icon tile
const CAT_TINT = {
  planificacion:  { bg: '#E9F2FA', fg: '#27466C' },
  diferenciacion: { bg: '#FFE9D6', fg: '#A8521A' },
  evaluacion:     { bg: '#EEE9FF', fg: '#6745EA' },
  lectura:        { bg: '#DFF5E8', fg: '#246B49' },
  asistentes:     { bg: '#FFF0D6', fg: '#B16C00' },
};

// Pick a sensible icon for each tool (fallback: sparkle)
function pickIcon(name, category) {
  const map = {
    'Plan My Lesson': Ic.doc, 'STEM Unit Planner': Ic.flask, 'Adaptar Lección': Ic.layers, 'Objetivos de Lenguaje': Ic.target,
    'Estrategia de Grupos': Ic.grupos, 'Diferenciar Contenido': Ic.layers, 'Diferenciar Proceso': Ic.sliders, 'Diferenciar Producto': Ic.trophy,
    'Plan de Intervención para Rezago': Ic.heart,
    'Crear Rúbrica': Ic.pendientes, 'Preguntas DOK': Ic.brain, 'Examen de Matemáticas': Ic.calc, 'Feedback Personalizado': Ic.msg2, 'Choice Board': Ic.board,
    'Creador de Assessments': Ic.check, 'Pruebas Diagnósticas': Ic.target,
    'Lectura por Nivel': Ic.book, 'Vocabulario Académico': Ic.abc, 'Preguntas de Comprensión': Ic.help, 'Evaluación Lexile': Ic.ruler,
    'Asistente de Matemáticas': Ic.calc, 'Asistente de Ciencias': Ic.flask, 'Asistente de ELA (Inglés)': Ic.book,
    'Estudios Sociales': Ic.globe, 'Asistente de Idiomas': Ic.speech, 'Coach de Ed. Especial': Ic.heart, 'Coach para ELL': Ic.globe,
  };
  return map[name] || Ic.sparkle;
}

export default function AIToolsPage() {
  const [active, setActive] = useState('all');
  const [search, setSearch] = useState('');
  // openTool can be: null | { tool: cfg, initialValues?: {} }
  const [openTool, setOpenTool] = useState(null);

  function openWith(toolCfg, initialValues = null) {
    setOpenTool({ tool: toolCfg, initialValues });
  }

  function handleSwitchTool(toolName, initialValues = {}) {
    const next = TOOLS[toolName];
    if (!next) return;
    // Force a fresh modal mount so initialValues take effect for the picker etc.
    setOpenTool(null);
    setTimeout(() => setOpenTool({ tool: next, initialValues }), 0);
  }

  const visible = useMemo(() => {
    const entries = Object.entries(TOOLS);
    return entries.filter(([name, cfg]) => {
      if (active !== 'all' && cfg.category !== active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!name.toLowerCase().includes(q) && !cfg.subtitle?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [active, search]);

  const counts = useMemo(() => {
    const c = { all: Object.keys(TOOLS).length };
    for (const cfg of Object.values(TOOLS)) c[cfg.category] = (c[cfg.category] || 0) + 1;
    return c;
  }, []);

  if (openTool) {
    return (
      <div className="ai-page ai-page-workspace">
        <ToolModal
          tool={openTool.tool}
          initialValues={openTool.initialValues}
          onClose={() => setOpenTool(null)}
          onSwitchTool={handleSwitchTool}
          embedded
        />
      </div>
    );
  }

  return (
    <div className="ai-page">
      <header className="ai-page-head">
        <div className="lhs">
          <div className="eyebrow"><Ic.sparkle /> Herramientas con IA</div>
          <h1>Tu copiloto educativo</h1>
          <p>Genera planes, rúbricas, adaptaciones, lecturas y más en segundos. {Object.keys(TOOLS).length} herramientas conectadas a OpenRouter.</p>
        </div>
        <div className="search-box">
          <Ic.search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar herramientas…"
          />
        </div>
      </header>

      <nav className="ai-cat-tabs" role="tablist">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`ai-cat-tab ${active === cat.id ? 'active' : ''}`}
            onClick={() => setActive(cat.id)}
            role="tab"
          >
            {cat.label}
            <span className="cat-count">{counts[cat.id] || 0}</span>
          </button>
        ))}
      </nav>

      <div className="ai-page-grid">
        {visible.map(([name, cfg], i) => {
          const tint = CAT_TINT[cfg.category] || CAT_TINT.planificacion;
          const Icon = pickIcon(name, cfg.category);
          return (
            <article
              key={name}
              className="ai-page-card"
              style={{ animation: `fadeUp .4s ${i * 25}ms both` }}
              onClick={() => openWith(cfg)}
            >
              <div className="ai-page-card-icon" style={{ background: tint.bg, color: tint.fg }}>
                <Icon />
              </div>
              <div className="ai-page-card-body">
                <h3>{name}</h3>
                <p>{cfg.subtitle}</p>
              </div>
              <div className="ai-page-card-foot">
                <span className="ai-page-cat">{CATEGORIES.find(c => c.id === cfg.category)?.label}</span>
                <button className="ai-page-use" onClick={(e) => { e.stopPropagation(); openWith(cfg); }}>
                  {cfg.isChat ? 'Chatear' : 'Usar'} <Ic.arrow />
                </button>
              </div>
            </article>
          );
        })}
        {visible.length === 0 && (
          <div className="ai-page-empty">No hay herramientas que coincidan con tu búsqueda.</div>
        )}
      </div>
    </div>
  );
}
