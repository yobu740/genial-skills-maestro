import React from 'react';

function getCode() {
  return window.location.pathname.split('/').filter(Boolean).pop()?.toUpperCase() || '';
}

export default function StudentQuiz() {
  const code = getCode();
  const [data, setData] = React.useState(null);
  const [studentName, setStudentName] = React.useState('');
  const [answers, setAnswers] = React.useState({});
  const [status, setStatus] = React.useState('loading');
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${code}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        setData(json);
        setStatus('ready');
      } catch (e) {
        setError(e.message || String(e));
        setStatus('error');
      }
    }
    load();
  }, [code]);

  async function submit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const res = await fetch(`/api/sessions/${code}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setResult(json);
      setStatus('submitted');
    } catch (err) {
      setError(err.message || String(err));
      setStatus('ready');
    }
  }

  if (status === 'loading') return <div className="student-quiz"><div className="quiz-card">Cargando evaluación...</div></div>;
  if (status === 'error') return <div className="student-quiz"><div className="quiz-card error">{error}</div></div>;

  const assessment = data?.assessment;
  const questions = assessment?.questions || [];

  return (
    <div className="student-quiz">
      <form className="quiz-card" onSubmit={submit}>
        <div className="quiz-code">Código {code}</div>
        <h1>{assessment?.title || 'Evaluación'}</h1>
        <p>{assessment?.subject} {assessment?.grade ? `· ${assessment.grade}` : ''}</p>

        {status === 'submitted' ? (
          <div className="quiz-done">
            <h2>Entregado</h2>
            <p>Tu maestra ya puede ver tus respuestas.</p>
            {Number.isFinite(result?.score) && (
              <strong>Puntuación automática: {result.score} / {result.maxScore}</strong>
            )}
          </div>
        ) : (
          <>
            <label className="quiz-name">
              <span>Nombre</span>
              <input value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
            </label>

            {questions.map((q, index) => (
              <section key={q.id} className="quiz-question">
                <h2>{index + 1}. {q.prompt}</h2>
                {q.type === 'multiple_choice' ? (
                  <div className="quiz-options">
                    {q.choices.map((choice) => (
                      <label key={choice.id}>
                        <input
                          type="radio"
                          name={q.id}
                          value={choice.id}
                          checked={answers[q.id] === choice.id}
                          onChange={(e) => setAnswers((s) => ({ ...s, [q.id]: e.target.value }))}
                          required
                        />
                        <span>{choice.id}. {choice.text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers((s) => ({ ...s, [q.id]: e.target.value }))}
                    placeholder="Escribe tu respuesta"
                    required
                  />
                )}
              </section>
            ))}

            {error && <div className="quiz-error">{error}</div>}
            <button className="quiz-submit" disabled={status === 'submitting' || !studentName.trim()}>
              {status === 'submitting' ? 'Entregando...' : 'Entregar'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
