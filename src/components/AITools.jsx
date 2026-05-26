import React from 'react';
import ToolModal from "./ToolModal.jsx";
import { TOOLS } from "../data/toolsConfig.js";
import Ic from './Icons.jsx';
/* AI Tools Panel — tabs: Planificación · Diferenciación · Evaluación · Lectura · Asistentes */

// AI_DATA is derived from toolsConfig.TOOLS at module load time, so adding a
// new tool there automatically surfaces it here (and in AIToolsPage). No more
// drift between the home grid and the dedicated Herramientas IA page.
const CATEGORY_LABELS = {
  planificacion:  'Planificación',
  diferenciacion: 'Diferenciación',
  evaluacion:     'Evaluación',
  lectura:        'Lectura',
  asistentes:     'Asistentes',
};

// Soft tint per category — matches the AIToolsPage palette for consistency.
const CAT_TINT = {
  planificacion:  { bg: '#E9F2FA', fg: '#27466C' },
  diferenciacion: { bg: '#FFE9D6', fg: '#A8521A' },
  evaluacion:     { bg: '#EEE9FF', fg: '#6745EA' },
  lectura:        { bg: '#DFF5E8', fg: '#246B49' },
  asistentes:     { bg: '#FFF0D6', fg: '#B16C00' },
};

// Per-tool icon mapping. Same list as AIToolsPage.pickIcon so the home and the
// dedicated page show identical icons.
const ICON_BY_NAME = {
  'Plan My Lesson': Ic.doc,
  'STEM Unit Planner': Ic.flask,
  'Adaptar Lección': Ic.layers,
  'Objetivos de Lenguaje': Ic.target,
  'Estrategia de Grupos': Ic.grupos,
  'Diferenciar Contenido': Ic.layers,
  'Diferenciar Proceso': Ic.sliders,
  'Diferenciar Producto': Ic.trophy,
  'Plan de Intervención para Rezago': Ic.heart,
  'Crear Rúbrica': Ic.pendientes,
  'Preguntas DOK': Ic.brain,
  'Examen de Matemáticas': Ic.calc,
  'Feedback Personalizado': Ic.msg2,
  'Choice Board': Ic.board,
  'Creador de Assessments': Ic.check,
  'Pruebas Diagnósticas': Ic.target,
  'Lectura por Nivel': Ic.book,
  'Vocabulario Académico': Ic.abc,
  'Preguntas de Comprensión': Ic.help,
  'Evaluación Lexile': Ic.ruler,
  'Asistente de Matemáticas': Ic.calc,
  'Asistente de Ciencias': Ic.flask,
  'Asistente de ELA (Inglés)': Ic.book,
  'Estudios Sociales': Ic.globe,
  'Asistente de Idiomas': Ic.speech,
  'Coach de Ed. Especial': Ic.heart,
  'Coach para ELL': Ic.globe,
};

const AI_DATA = (() => {
  const out = {};
  for (const [name, cfg] of Object.entries(TOOLS)) {
    const cat = cfg.category || 'planificacion';
    if (!out[cat]) out[cat] = { label: CATEGORY_LABELS[cat] || cat, items: [] };
    const tint = CAT_TINT[cat] || CAT_TINT.planificacion;
    out[cat].items.push({
      name,
      desc: cfg.subtitle || '',
      Icon: ICON_BY_NAME[name] || Ic.sparkle,
      bg: tint.bg,
      fg: tint.fg,
    });
  }
  // Preserve a sensible category order on the tabs even if TOOLS iteration order
  // doesn't already match (object iteration is insertion order in modern JS,
  // but be explicit here).
  return Object.fromEntries(
    Object.keys(CATEGORY_LABELS).filter(k => out[k]).map(k => [k, out[k]])
  );
})();

function AITools() {
  const tabs = Object.keys(AI_DATA);
  const [active, setActive] = React.useState('planificacion');
  const [openTool, setOpenTool] = React.useState(null);
  const data = AI_DATA[active];
  const isAssist = active === 'asistentes';

  const openIfConfigured = (name) => {
    const cfg = TOOLS?.[name];
    if (cfg) setOpenTool(cfg);
    else alert(`"${name}" todavía no está configurada — próximamente.`);
  };

  return (
    <section className="ai-panel">
      <div className="ai-head">
        <div className="lhs">
          <h2><span className="sparkle"><Ic.sparkle /></span> Herramientas con IA</h2>
          <p>Tu copiloto educativo. Genera planes, rúbricas, adaptaciones y más en segundos.</p>
        </div>
        <div className="ai-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              className={`ai-tab ${active === t ? 'active' : ''}`}
              onClick={() => setActive(t)}
            >
              {AI_DATA[t].label}
              <span className="count">{AI_DATA[t].items.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`ai-grid ${isAssist ? 'assistants' : ''}`}>
        {data.items.map((it, i) => {
          const configured = !!TOOLS?.[it.name];
          return isAssist ? (
            <article
              key={i}
              className={`ai-card assistant ${configured ? '' : 'soon'}`}
              style={{animation: `fadeUp .5s ${i*40}ms both`}}
              onClick={() => openIfConfigured(it.name)}
            >
              <div className="av"><it.Icon /></div>
              <div className="ai-name">{it.name}</div>
              <div className="ai-desc">{it.desc}</div>
              <button className="chat-now" onClick={(e) => { e.stopPropagation(); openIfConfigured(it.name); }}>
                {configured ? 'Chatear' : 'Próximamente'} <Ic.arrow />
              </button>
            </article>
          ) : (
            <article
              key={i}
              className={`ai-card ${configured ? '' : 'soon'}`}
              style={{animation: `fadeUp .5s ${i*40}ms both`}}
              onClick={() => openIfConfigured(it.name)}
            >
              <div className="ai-icon"><it.Icon /></div>
              <div className="ai-name">{it.name}</div>
              <div className="ai-desc">{it.desc}</div>
              <button className="ai-use" onClick={(e) => { e.stopPropagation(); openIfConfigured(it.name); }}>
                {configured ? 'Usar' : 'Próximamente'} <Ic.arrow />
              </button>
            </article>
          );
        })}
      </div>

      {openTool && <ToolModal tool={openTool} onClose={() => setOpenTool(null)} />}
    </section>
  );
}

export default AITools;
