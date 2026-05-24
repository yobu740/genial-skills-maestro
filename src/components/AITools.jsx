import React from 'react';
import ToolModal from "./ToolModal.jsx";
import { TOOLS } from "../data/toolsConfig.js";
import Ic from './Icons.jsx';
/* AI Tools Panel — tabs: Planificación · Diferenciación · Evaluación · Lectura · Asistentes */

const AI_DATA = {
  planificacion: {
    label: 'Planificación',
    items: [
      { name:'Plan My Lesson',         desc:'Genera planes según materia, grado y estándar.', Icon: Ic.doc,    bg:'#E9F2FA', fg:'#27466C' },
      { name:'STEM Unit Planner',      desc:'Diseña unidades STEM completas con proyectos.',   Icon: Ic.flask,  bg:'#DFF5E8', fg:'#246B49' },
      { name:'Adaptar Lección',        desc:'Adapta planes para ELL o necesidades especiales.',Icon: Ic.layers, bg:'#FFE9D6', fg:'#A8521A' },
      { name:'Objetivos de Lenguaje',  desc:'Crea metas lingüísticas para estudiantes ELL.',   Icon: Ic.target, bg:'#EEE9FF', fg:'#6745EA' },
    ],
  },
  diferenciacion: {
    label: 'Diferenciación',
    items: [
      { name:'Estrategia de Grupos',    desc:'Sugiere agrupaciones según el nivel actual.',   Icon: Ic.grupos,  bg:'#E6F5F4', fg:'#246F6F' },
      { name:'Diferenciar Contenido',   desc:'Adapta el qué se enseña a cada estudiante.',     Icon: Ic.layers,  bg:'#FFE9D6', fg:'#A8521A' },
      { name:'Diferenciar Proceso',     desc:'Adapta cómo aprende cada estudiante.',           Icon: Ic.sliders, bg:'#EEE9FF', fg:'#6745EA' },
      { name:'Diferenciar Producto',    desc:'Adapta cómo demuestran lo aprendido.',           Icon: Ic.trophy,  bg:'#FFF0D6', fg:'#B16C00' },
    ],
  },
  evaluacion: {
    label: 'Evaluación',
    items: [
      { name:'Crear Rúbrica',          desc:'Genera rúbricas para cualquier tarea o proyecto.', Icon: Ic.pendientes,bg:'#E9F2FA', fg:'#27466C' },
      { name:'Preguntas DOK',          desc:'Crea preguntas por nivel de complejidad cognitiva.',Icon: Ic.brain,    bg:'#EEE9FF', fg:'#6745EA' },
      { name:'Examen de Matemáticas',  desc:'Crea pruebas matemáticas adaptadas al grado.',     Icon: Ic.calc,     bg:'#DFF5E8', fg:'#246B49' },
      { name:'Feedback Personalizado', desc:'Retroalimentación individual para cada estudiante.',Icon: Ic.msg2,    bg:'#E6F5F4', fg:'#246F6F' },
      { name:'Choice Board',           desc:'Tablero de opciones diferenciadas para tareas.',   Icon: Ic.board,    bg:'#FFE9D6', fg:'#A8521A' },
    ],
  },
  lectura: {
    label: 'Lectura',
    items: [
      { name:'Lectura por Nivel',         desc:'Crea textos adaptados por grado escolar.',    Icon: Ic.book,  bg:'#E9F2FA', fg:'#27466C' },
      { name:'Vocabulario Académico',     desc:'Genera listas de vocabulario por temática.',  Icon: Ic.abc,   bg:'#FFE9D6', fg:'#A8521A' },
      { name:'Preguntas de Comprensión',  desc:'Literal, inferencial y crítica en un click.', Icon: Ic.help,  bg:'#EEE9FF', fg:'#6745EA' },
      { name:'Evaluación Lexile',         desc:'Pruebas por nivel lector con feedback.',      Icon: Ic.ruler, bg:'#DFF5E8', fg:'#246B49' },
    ],
  },
  asistentes: {
    label: 'Asistentes',
    items: [
      { name:'Asistente de Matemáticas',  desc:'Experto en álgebra, geometría y aritmética.', Icon: Ic.calc,   bg:'#E9F2FA', fg:'#27466C' },
      { name:'Asistente de Ciencias',      desc:'Biología, química, física y experimentos.',  Icon: Ic.flask,  bg:'#DFF5E8', fg:'#246B49' },
      { name:'Asistente de ELA (Inglés)',  desc:'Gramática, escritura y comprensión.',        Icon: Ic.book,   bg:'#FFF0D6', fg:'#B16C00' },
      { name:'Estudios Sociales',          desc:'Historia, geografía y cultura.',             Icon: Ic.globe,  bg:'#E6F5F4', fg:'#246F6F' },
      { name:'Asistente de Idiomas',       desc:'Inglés, español y traducción contextual.',   Icon: Ic.speech, bg:'#EEE9FF', fg:'#6745EA' },
      { name:'Coach de Ed. Especial',      desc:'Estrategias para estudiantes con SPED.',     Icon: Ic.heart,  bg:'#FBE3E2', fg:'#9D3835' },
      { name:'Coach para ELL',             desc:'Apoyo a aprendices de inglés.',              Icon: Ic.globe,  bg:'#FFE9D6', fg:'#A8521A' },
    ],
  },
};

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
