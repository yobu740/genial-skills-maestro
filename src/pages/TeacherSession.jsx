import React from 'react';

function getCode() {
  return window.location.pathname.split('/').filter(Boolean).pop()?.toUpperCase() || '';
}

export default function TeacherSession() {
  const code = getCode();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');
  const origin = window.location.origin;
  const studentUrl = `${origin}/student/quiz/${code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(studentUrl)}`;

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${code}/results`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
      setError('');
    } catch (e) {
      setError(e.message || String(e));
    }
  }, [code]);

  React.useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const responses = data?.responses || [];
  const assessment = data?.assessment;
  const average = responses.length
    ? responses.reduce((sum, r) => sum + Number(r.score || 0), 0) / responses.length
    : 0;
  const max = responses[0]?.max_score || assessment?.questions?.length || 0;

  return (
    <div className="teacher-session">
      <section className="session-hero">
        <div>
          <span className="session-eyebrow">Sesión interactiva</span>
          <h1>{assessment?.title || 'Evaluación'}</h1>
          <p>Los estudiantes escanean el QR o entran con el enlace para contestar desde sus dispositivos.</p>
          <div className="session-code">{code}</div>
        </div>
        <div className="session-qr">
          <img src={qrUrl} alt={`QR para sesión ${code}`} />
          <button onClick={() => navigator.clipboard.writeText(studentUrl)}>Copiar enlace</button>
        </div>
      </section>

      {error && <div className="session-error">{error}</div>}

      <section className="session-stats">
        <div><strong>{responses.length}</strong><span>Entregas</span></div>
        <div><strong>{average.toFixed(1)}</strong><span>Promedio</span></div>
        <div><strong>{max}</strong><span>Puntos</span></div>
      </section>

      <section className="session-results">
        <div className="session-results-head">
          <h2>Resultados</h2>
          <button onClick={load}>Actualizar</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Puntuación</th>
              <th>Entregado</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id}>
                <td>{r.student_name}</td>
                <td>{r.score} / {r.max_score}</td>
                <td>{new Date(r.submitted_at).toLocaleString()}</td>
              </tr>
            ))}
            {!responses.length && (
              <tr><td colSpan="3">Todavía no hay entregas.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
