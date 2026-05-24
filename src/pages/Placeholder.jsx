import React from 'react';

export default function Placeholder({ title }) {
  return (
    <div style={{ padding: '40px 28px' }}>
      <h1 style={{ fontFamily: 'Sora', fontSize: 26, color: '#27466C', marginBottom: 8 }}>{title}</h1>
      <p style={{ color: '#6B7A93', maxWidth: 60 + 'ch' }}>
        Esta sección se conectará al API real (<code>baseapi.genialskillsweb.com</code> / <code>athenasapi.genialskillsweb.com</code>) en una próxima iteración. Por ahora visita <strong>Inicio</strong> para usar las herramientas de IA, <strong>Planificación</strong> para crear/ver planes, o <strong>Catálogo</strong> para explorar lecciones.
      </p>
    </div>
  );
}
