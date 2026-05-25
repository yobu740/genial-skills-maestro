import React from 'react';
import Ic from './Icons.jsx';
/* Quick access grid — 6 sections, clean version (no pulse chips, single accent column). */

// Brand accent for "Entrar →" CTA — matches the orange "Generar" button
// from the right-column AI prompt, keeping the dashboard visually cohesive.
const ENTRAR_ACCENT = '#E88B19';

function QuickGrid() {
  // Soft pastel tints — pale background + darker icon color. Title stays in ink.
  const cards = [
    {
      id:'grupos',  title:'Grupos',
      Icon: Ic.grupos,
      bg: '#D6EFEE', fg: '#2F8E8E',     // pale teal + darker teal
      desc:'Administra tus grupos de estudiantes.',
      meta:'5 grupos · 34 estudiantes',
    },
    {
      id:'pendientes', title:'Pendientes',
      Icon: Ic.pendientes,
      bg: '#FCE5DA', fg: '#C75A38',     // pale coral + darker
      desc:'Revisa y corrige asignaciones pendientes.',
      meta:'3 entregas por corregir',
    },
    {
      id:'mensajeria', title:'Mensajería',
      Icon: Ic.mensajeria,
      bg: '#D6F0EC', fg: '#1F8478',     // pale turquoise
      desc:'Envía mensajes a estudiantes y padres.',
      meta:'1 mensaje nuevo',
    },
    {
      id:'planificacion', title:'Planificación',
      Icon: Ic.planificacion,
      bg: '#FCEACF', fg: '#B27516',     // pale amber
      desc:'Planifica clases y asigna lecciones.',
      meta:'Plan activo: Semana 14',
    },
    {
      id:'progreso', title:'Progreso',
      Icon: Ic.progreso,
      bg: '#DCEFE0', fg: '#3A8E5C',     // pale green
      desc:'Monitorea el progreso y los resultados de evaluaciones.',
      meta:'Promedio del grupo: 78%',
    },
    {
      id:'estudiantes', title:'Estudiantes',
      Icon: Ic.estudiante,
      bg: '#F6DCD9', fg: '#A0413D',     // pale terracotta
      desc:'Gestiona estudiantes, códigos de invitación y contraseñas.',
      meta:'34 activos · 2 invitaciones',
    },
  ];

  return (
    <div>
      <div className="section-head" style={{marginBottom:14}}>
        <div className="lhs">
          <h2>Accesos rápidos</h2>
        </div>
        <div className="rhs">
          <a href="#">Ver todo <Ic.chev /></a>
        </div>
      </div>

      <div className="qa-grid">
        {cards.map((c, i) => (
          <article
            key={c.id}
            className="qa-card"
            style={{ animationDelay: `${i * 50}ms`, '--card-accent': c.fg }}
          >
            <div className="qa-icon" style={{ background: c.bg, color: c.fg }}>
              <c.Icon />
            </div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <div className="qa-foot">
              <div className="meta">{c.meta}</div>
              <button className="enter" style={{ color: ENTRAR_ACCENT }}>
                Entrar <Ic.arrow />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default QuickGrid;
