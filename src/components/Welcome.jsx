import React from 'react';
/* Welcome banner — greeting + stats KPIs + quick-ask CTA */

function useCount(target, dur = 900, deps = []) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    let raf, start;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, deps); // eslint-disable-line
  return n;
}

function Welcome({ teacher }) {
  const pend = useCount(teacher.stats.pendientes);
  const stud = useCount(teacher.stats.estudiantesActivos);
  const grp  = useCount(teacher.stats.gruposHoy);
  const msg  = useCount(teacher.stats.mensajesNuevos);

  const today = new Date();
  const hour = today.getHours();
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const displayDate = new Intl.DateTimeFormat('es-PR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(today);
  const formattedDate = displayDate.charAt(0).toUpperCase() + displayDate.slice(1);
  const demoWeek = 14;
  const firstName = (teacher?.name || 'José').split(/\s+/)[0];

  return (
    <section className="welcome">
      <div className="greet">
        <div className="eyebrow">{formattedDate} · Semana {demoWeek}</div>
        <h1>{saludo}, {firstName}</h1>
        <p>Tienes <b>3 entregas por corregir</b> y <b>1 mensaje nuevo</b>.</p>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="kv">{pend}</div>
          <div className="kl">Por corregir</div>
        </div>
        <div className="kpi">
          <div className="kv">{stud}</div>
          <div className="kl">Estudiantes activos</div>
        </div>
        <div className="kpi">
          <div className="kv">{grp}</div>
          <div className="kl">Grupos</div>
        </div>
        <div className="kpi">
          <div className="kv">{msg}</div>
          <div className="kl">Mensajes nuevos</div>
        </div>
      </div>
    </section>
  );
}

export default Welcome;
