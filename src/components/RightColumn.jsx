import React from 'react';
import ToolModal from "./ToolModal.jsx";
import Ic from './Icons.jsx';
/* Right column — Academic period + weekly plan + AI prompt */

const ASK_TOOL = {
  title: 'Asistente IA',
  subtitle: 'Pídele a la IA cualquier cosa que necesites como maestro.',
  defaultModel: 'anthropic/claude-sonnet-4.5',
  fields: [
    { name: 'pregunta', label: 'Tu solicitud', type: 'textarea', rows: 6, required: true,
      placeholder: 'Ej: una rúbrica de comprensión lectora para 4to grado…' },
  ],
  system: 'Eres un asistente pedagógico experto para maestros de Puerto Rico. Respondes en español, en markdown, con estructura clara y contenido directamente utilizable. No incluyas disclaimers innecesarios.',
  buildPrompt: (f) => f.pregunta,
};

function RightColumn({ onNavigate }) {
  const [askOpen, setAskOpen] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [weekPlan, setWeekPlan] = React.useState([]);

  React.useEffect(() => {
    try {
      const savedPlans = JSON.parse(localStorage.getItem("gsm_teacher_plannings") || "[]");
      const lessonsThisWeek = [];
      if (savedPlans && savedPlans.length > 0) {
        for (const plan of savedPlans) {
          const lessonsList = plan.Lessons || [];
          for (const lesson of lessonsList) {
            lessonsThisWeek.push({
              subj: plan.SubjectName || 'Planificación',
              unit: lesson.title || 'Lección',
              groups: plan.GroupName || 'Grupo'
            });
          }
        }
      }
      if (lessonsThisWeek.length > 0) {
        setWeekPlan(lessonsThisWeek.slice(0, 5));
      } else {
        setWeekPlan([
          { subj:'Matemáticas',     unit:'Unidad 6 · Fracciones equivalentes',     groups:'5A · 5B' },
          { subj:'Ciencias',        unit:'Unidad 4 · Ecosistemas de Puerto Rico',  groups:'5A' },
          { subj:'Estudios Sociales', unit:'Unidad 3 · Geografía del Caribe',      groups:'5B' },
        ]);
      }
    } catch (e) {
      console.error(e);
      setWeekPlan([
        { subj:'Matemáticas',     unit:'Unidad 6 · Fracciones equivalentes',     groups:'5A · 5B' },
        { subj:'Ciencias',        unit:'Unidad 4 · Ecosistemas de Puerto Rico',  groups:'5A' },
        { subj:'Estudios Sociales', unit:'Unidad 3 · Geografía del Caribe',      groups:'5B' },
      ]);
    }
  }, []);

  // Academic period progress
  const weekNow = 14;
  const weekTotal = 18;
  const pct = Math.round((weekNow / weekTotal) * 100);

  // Open modal with the current draft pre-filled
  const openAsk = () => {
    const tool = { ...ASK_TOOL, fields: ASK_TOOL.fields.map(f => ({ ...f, default: f.name === 'pregunta' ? draft : f.default })) };
    setAskOpen(tool);
  };

  return (
    <>
      {/* Periodo académico */}
      <div className="widget">
        <div className="w-head">
          <h3>Periodo académico</h3>
          <a href="#">Detalles</a>
        </div>
        <div className="period">
          <div className="period-top">
            <div className="period-name">4to periodo</div>
            <div className="period-year">2025 – 2026</div>
          </div>
          <div className="period-meta">
            <span>Semana <b>{weekNow}</b> de {weekTotal}</span>
            <span>·</span>
            <span>Finaliza el <b>27 de junio</b></span>
          </div>
          <div className="period-bar"><div className="period-fill" style={{width: pct + '%'}} /></div>
        </div>
      </div>

      {/* Plan de la semana */}
      <div className="widget">
        <div className="w-head">
          <h3>Plan de esta semana</h3>
          <a
            href="/planning-select"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('/planning-select');
            }}
          >
            Editar
          </a>
        </div>
        <ul className="plan-list">
          {weekPlan.map((p, i) => (
            <li key={i} className="plan-item">
              <div className="plan-subj">{p.subj}</div>
              <div className="plan-unit">{p.unit}</div>
              <div className="plan-groups">{p.groups}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* AI prompt */}
      <div className="widget ai-ask">
        <h3><span className="sparkle"><Ic.sparkle /></span> Asistente IA</h3>
        <p>Describe lo que necesitas y la IA te ayudará a empezar.</p>
        <div className="field">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ej: una rúbrica de comprensión lectora para 4to grado…"
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') openAsk(); }}
          />
        </div>
        <button className="generate" onClick={openAsk} disabled={!draft.trim()}>
          <Ic.sparkle /> Generar <Ic.arrow />
        </button>
      </div>

      {askOpen && <ToolModal tool={askOpen} onClose={() => setAskOpen(false)} />}
    </>
  );
}

export default RightColumn;
