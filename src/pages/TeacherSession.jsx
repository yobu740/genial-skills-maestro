import React from 'react';
import MarkdownMath from '../components/MarkdownMath.jsx';

function getCode() {
  return window.location.pathname.split('/').filter(Boolean).pop()?.toUpperCase() || '';
}

export default function TeacherSession({ onNavigate }) {
  const code = getCode();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');
  const [selectedId, setSelectedId] = React.useState('');
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
  const questions = assessment?.questions || [];
  const average = responses.length
    ? responses.reduce((sum, r) => sum + Number(r.score || 0), 0) / responses.length
    : 0;
  const max = responses[0]?.max_score || questions.length || 0;
  const selectedResponse = responses.find((r) => r.id === selectedId) || responses[0] || null;

  function backToTeacherArea() {
    if (typeof onNavigate === 'function') onNavigate('/ai-tools');
    else window.location.href = '/ai-tools';
  }

  return (
    <div className="teacher-session">
      <div className="session-topbar">
        <button type="button" onClick={backToTeacherArea}>Volver a herramientas IA</button>
      </div>

      <section className="session-hero">
        <div>
          <span className="session-eyebrow">Sesion interactiva</span>
          <h1>{assessment?.title || 'Evaluacion'}</h1>
          <p>Los estudiantes escanean el QR o entran con el enlace para contestar desde sus dispositivos.</p>
          <div className="session-code">{code}</div>
        </div>
        <div className="session-qr">
          <img src={qrUrl} alt={`QR para sesion ${code}`} />
          <button type="button" onClick={() => navigator.clipboard.writeText(studentUrl)}>Copiar enlace</button>
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
          <button type="button" onClick={load}>Actualizar</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Puntuacion</th>
              <th>Entregado</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className={selectedResponse?.id === r.id ? 'is-selected' : ''}>
                <td>{r.student_name}</td>
                <td>{r.score} / {r.max_score}</td>
                <td>{new Date(r.submitted_at).toLocaleString()}</td>
                <td>
                  <button type="button" className="session-link-button" onClick={() => setSelectedId(r.id)}>Ver</button>
                </td>
              </tr>
            ))}
            {!responses.length && (
              <tr><td colSpan="4">Todavia no hay entregas.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {selectedResponse && (
        <section className="session-results session-detail">
          <div className="session-results-head">
            <div>
              <h2>{selectedResponse.student_name}</h2>
              <p>{selectedResponse.score} / {selectedResponse.max_score} puntos</p>
            </div>
          </div>

          <div className="session-answer-list">
            {questions.map((q, index) => {
              const answer = selectedResponse.answers?.[q.id] ?? '';
              const expected = q.answer || '';
              const isChoice = q.type === 'multiple_choice';
              const selectedChoice = isChoice ? q.choices?.find((c) => c.id === answer) : null;
              const expectedChoice = isChoice ? q.choices?.find((c) => c.id === expected) : null;
              const correct = expected && String(answer).trim().toLowerCase() === String(expected).trim().toLowerCase();

              return (
                <article key={q.id} className="session-answer-card">
                  <div className="session-answer-head">
                    <strong>Pregunta {index + 1}</strong>
                    {expected && <span className={correct ? 'ok' : 'needs-review'}>{correct ? 'Correcta' : 'Revisar'}</span>}
                  </div>
                  <MarkdownMath className="session-question-text">{q.prompt}</MarkdownMath>
                  <div className="session-answer-grid">
                    <div>
                      <span>Respuesta del estudiante</span>
                      <MarkdownMath>{selectedChoice ? `${answer}. ${selectedChoice.text}` : String(answer || 'Sin respuesta')}</MarkdownMath>
                    </div>
                    <div>
                      <span>Respuesta esperada</span>
                      <MarkdownMath>{expectedChoice ? `${expected}. ${expectedChoice.text}` : String(expected || 'No definida')}</MarkdownMath>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
