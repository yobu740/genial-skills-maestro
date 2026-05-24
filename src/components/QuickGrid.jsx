import React from 'react';
import Ic from './Icons.jsx';
/* Quick access grid — 6 sections, clean version (no pulse chips, single accent column). */

function QuickGrid() {
  // Colors echo the reference (live platform): each circle a distinct hue
  const cards = [
    {
      id:'grupos',  title:'Grupos',
      Icon: Ic.grupos,
      color: '#3DA8A8',          // teal — sense of community/teams
      titleColor: '#246F6F',
      desc:'Administre sus grupos de estudiantes, cree, edite y agregue nuevos miembros.',
      meta:'5 grupos · 34 estudiantes',
    },
    {
      id:'pendientes', title:'Pendientes',
      Icon: Ic.pendientes,
      color: '#E5734D',          // coral — "to do" energy
      titleColor: '#B14E2D',
      desc:'Acceda aquí para ver las asignaciones pendientes de corregir.',
      meta:'3 entregas por corregir',
    },
    {
      id:'mensajeria', title:'Mensajería',
      Icon: Ic.mensajeria,
      color: '#2EB6A8',          // turquoise — fresh communication
      titleColor: '#1F8478',
      desc:'Vea y envíe mensajes a estudiantes y padres.',
      meta:'1 mensaje nuevo',
    },
    {
      id:'planificacion', title:'Planificación',
      Icon: Ic.planificacion,
      color: '#E89B1E',          // amber — calendar/agenda
      titleColor: '#9C661A',
      desc:'Planifique sus clases, seleccione lecciones y envíe asignaciones.',
      meta:'Plan activo: Semana 14',
    },
    {
      id:'progreso', title:'Progreso',
      Icon: Ic.progreso,
      color: '#4FAE6F',          // green — growth
      titleColor: '#2F7448',
      desc:'Monitoree el progreso del estudiante y los resultados de evaluaciones.',
      meta:'Promedio del grupo: 78%',
    },
    {
      id:'estudiantes', title:'Estudiantes',
      Icon: Ic.estudiante,
      color: '#C9544F',          // terracotta — graduation/identity
      titleColor: '#8E332E',
      desc:'Añada estudiantes con códigos de invitación y restablezca contraseñas.',
      meta:'34 activos · 2 invitaciones',
    },
  ];

  return (
    <div>
      <div className="section-head" style={{marginBottom:14}}>
        <div className="lhs">
          <h2>Tus accesos rápidos</h2>
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
            style={{ animationDelay: `${i * 50}ms`, '--card-accent': c.color, '--card-title': c.titleColor }}
          >
            <div className="qa-icon" style={{ background: c.color, color: '#fff' }}>
              <c.Icon />
            </div>
            <h3 style={{ color: c.titleColor }}>{c.title}</h3>
            <p>{c.desc}</p>
            <div className="qa-foot">
              <div className="meta">{c.meta}</div>
              <button className="enter" style={{ color: c.color }}>Entrar <Ic.arrow /></button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default QuickGrid;
