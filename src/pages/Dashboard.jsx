import React from 'react';
import Welcome from '../components/Welcome.jsx';
import QuickGrid from '../components/QuickGrid.jsx';
import AITools from '../components/AITools.jsx';
import RightColumn from '../components/RightColumn.jsx';

const TEACHER = {
  name: 'José Maestro',
  avatar: 'JM',
  stats: { pendientes: 3, estudiantesActivos: 12, gruposHoy: 2, mensajesNuevos: 1 },
  grupos: 5, estudiantes: 34, progresoPromedio: 78,
};

export default function Dashboard({ onNavigate }) {
  return (
    <div className="content">
      <div className="content-left">
        <Welcome teacher={TEACHER} />
        <QuickGrid onNavigate={onNavigate} />
        <AITools />
      </div>
      <div className="content-right">
        <RightColumn onNavigate={onNavigate} />
      </div>
    </div>
  );
}
