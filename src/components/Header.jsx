import React from 'react';
import Ic from './Icons.jsx';
function Header() {
  return (
    <header className="header" style={{ backgroundColor: "rgb(39, 71, 108)" }}>
      <div className="crumb">
        <b style={{ color: "rgb(255, 255, 255)" }}>Dashboard</b> &nbsp;·&nbsp; Inicio
      </div>

      <div className="search">
        <Ic.search />
        <input placeholder="Buscar estudiantes, grupos, lecciones, herramientas IA…" />
        <kbd>⌘K</kbd>
      </div>

      <div className="h-actions">
        <a className="h-link" href="#" style={{ color: "rgb(255, 255, 255)", backgroundColor: "rgb(39, 71, 108)" }}><Ic.pkg /> Entregables</a>
        <a className="h-link" href="#" style={{ color: "rgb(255, 255, 255)" }}><Ic.help /> Ayuda</a>

        <button className="h-icon-btn" title="Notificaciones" aria-label="Notificaciones">
          <Ic.bell />
          <span className="dot" />
        </button>

        <div className="h-profile">
          <div className="avatar">JM</div>
          <div className="name-block">
            <div className="n">José Maestro</div>
            <div className="r">Maestro · 5to grado</div>
          </div>
          <Ic.chev />
        </div>
      </div>
    </header>);

}
export default Header;