import React from 'react';
import Ic from './Icons.jsx';
/* Sidebar — keeps the teal palette + icon set of the original Genial Skills nav. */

function Sidebar({ active, onSelect }) {
  const main = [
    { id: 'inicio',         label: 'Inicio',         icon: Ic.inicio },
    { id: 'estudiantes',    label: 'Estudiantes',    icon: Ic.estudiante },
    { id: 'grupos',         label: 'Grupos',         icon: Ic.grupos },
    { id: 'planificacion',  label: 'Planificación',  icon: Ic.planificacion },
    { id: 'progreso',       label: 'Progreso',       icon: Ic.progreso },
    { id: 'pendientes',     label: 'Pendientes',     icon: Ic.pendientes, badge: '3' },
  ];
  const comms = [
    { id: 'mensajeria',     label: 'Mensajería',     icon: Ic.mensajeria, badge: '1' },
    { id: 'invitaciones',   label: 'Invitaciones',   icon: Ic.invitaciones },
    { id: 'chat',           label: 'Chat',           icon: Ic.chat },
    { id: 'teams',          label: 'Teams',          icon: Ic.teams },
  ];
  const platform = [
    { id: 'catalogo',       label: 'Catálogo',       icon: Ic.catalogo },
    { id: 'config',         label: 'Configuración',  icon: Ic.cogs },
  ];

  const Item = ({ it, ai }) => (
    <li
      className={`sb-item ${active === it.id ? 'active' : ''} ${ai ? 'ai' : ''}`}
      onClick={() => onSelect && onSelect(it.id)}
      title={it.label}
    >
      <span className="sb-icon"><it.icon /></span>
      <span className="sb-label">{it.label}</span>
      {it.badge ? <span className="sb-badge">{it.badge}</span> : null}
    </li>
  );

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="g-tile">G</div>
        <div className="g-word">
          GENIAL
          <small>SKILLS</small>
        </div>
      </div>

      <div className="sb-section-title">Principal</div>
      <ul className="sb-list">
        {main.map((it) => <Item key={it.id} it={it} />)}
      </ul>

      <div className="sb-section-title">Comunicación</div>
      <ul className="sb-list">
        {comms.map((it) => <Item key={it.id} it={it} />)}
      </ul>

      <div className="sb-section-title">Plataforma</div>
      <ul className="sb-list">
        {platform.map((it) => <Item key={it.id} it={it} />)}
      </ul>

      <div className="sb-section-title">Inteligencia Artificial</div>
      <ul className="sb-list">
        <Item it={{ id: 'ia', label: 'Asistentes IA', icon: Ic.sparkle }} ai />
      </ul>
    </aside>
  );
}

export default Sidebar;
