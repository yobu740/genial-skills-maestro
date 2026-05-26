import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { getStandards } from './standards-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('Missing OPENROUTER_API_KEY in .env');
  process.exit(1);
}

app.use(express.json({ limit: '1mb' }));

// In production, serve the built Vite app from /dist. Do not cache index.html:
// after a deploy, a stale HTML file can point to hashed assets that no longer exist.
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders(res, filePath) {
    if (path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-store');
    } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

/**
 * Weekly plan files (PDF/DOCX/PPTX) are large (~6GB). They are NOT in the repo.
 * Locally: served from disk via /plans-files/ static mounts (when folders exist).
 * Production: set WEEKLY_PLANS_BASE_URL=https://files.example.r2.dev (Cloudflare R2 bucket)
 *   and the publicUrl() function below will point to the bucket instead.
 */
import fsSync from 'node:fs';
const planFolders = [
  ['/plans-files/planes-semanales',  path.join(__dirname, 'Planes semanales')],
  ['/plans-files/bellas-artes',      path.join(__dirname, 'BELLAS ARTES-Planes semanales-20260521T025922Z-3-001')],
  ['/plans-files/estudios-sociales', path.join(__dirname, 'Estudios sociales-Planes semanales')],
];
for (const [mount, dir] of planFolders) {
  if (fsSync.existsSync(dir)) app.use(mount, express.static(dir));
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function requireSupabase(res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(503).json({ error: 'Supabase is not configured. Set SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
    return false;
  }
  return true;
}

async function supabaseRequest(table, { method = 'GET', query = '', body, prefer } = {}) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}${query}`;
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message || data?.error || text || `Supabase ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function makeSessionCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function stripMarkdown(text = '') {
  return String(text)
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^\s*#+\s*/, '')
    .trim();
}

function extractJsonObject(text = '') {
  const cleaned = String(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(cleaned.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

function parseAssessmentMarkdown(markdown, fallbackTitle = 'Examen interactivo') {
  const lines = String(markdown || '').replace(/\r/g, '').split('\n');
  const title = stripMarkdown(lines.find(l => /^#\s+/.test(l))?.replace(/^#\s+/, '') || fallbackTitle);
  const answerMap = new Map();
  let inAnswers = false;

  for (const raw of lines) {
    const line = stripMarkdown(raw);
    if (/hoja de respuestas|clave de respuestas|respuestas/i.test(line)) inAnswers = true;
    if (!inAnswers) continue;
    const m = line.match(/^(?:problema|pregunta)?\s*(\d+)[.)\-:]?\s*(?:respuesta|clave|correcta)?\s*:?\s*([A-Da-d]|verdadero|falso|true|false|[-+]?\d+(?:[./]\d+)?)/i);
    if (m) answerMap.set(Number(m[1]), String(m[2]).trim());
  }

  const questions = [];
  let current = null;
  const optionRe = /^\s*(?:[-*]\s*)?([A-Da-d])(?:[.)]|:|-)\s+(.+)/;
  const questionRe = /^\s*(?:problema|pregunta|ejercicio)?\s*(\d+)(?:[.)]|:|-)\s+(.+)/i;

  function flush() {
    if (!current) return;
    current.prompt = stripMarkdown(current.prompt);
    current.choices = current.choices.map(c => ({ ...c, text: stripMarkdown(c.text) })).filter(c => c.text);
    if (current.choices.length >= 2) current.type = 'multiple_choice';
    current.answer = answerMap.get(current.number) || current.answer || '';
    current.points = 1;
    questions.push(current);
  }

  for (const raw of lines) {
    const line = stripMarkdown(raw).replace(/^\s*[-*]\s+/, '').trim();
    if (!line || /hoja de respuestas|clave de respuestas/i.test(line)) {
      if (/hoja de respuestas|clave de respuestas/i.test(line)) break;
      continue;
    }
    const q = line.match(questionRe);
    if (q) {
      flush();
      current = {
        id: `q${q[1]}`,
        number: Number(q[1]),
        type: 'short_answer',
        prompt: q[2],
        choices: [],
        answer: '',
      };
      continue;
    }
    const opt = line.match(optionRe);
    if (current && opt) {
      current.choices.push({ id: opt[1].toUpperCase(), text: opt[2] });
      continue;
    }
    if (current && !/^#{1,6}\s+/.test(line)) current.prompt += ` ${line}`;
  }
  flush();

  return {
    title,
    questions: questions.slice(0, 50),
  };
}

function normalizeAnswer(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function scoreAnswers(questions, answers) {
  let score = 0;
  let max = 0;
  for (const q of questions || []) {
    const points = Number(q.points || 1);
    max += points;
    const expected = normalizeAnswer(q.answer);
    const given = normalizeAnswer(answers?.[q.id]);
    if (!expected || !given) continue;
    if (q.type === 'multiple_choice') {
      if (given === expected || given === expected.charAt(0)) score += points;
    } else if (given === expected) {
      score += points;
    }
  }
  return { score, max };
}

async function callOpenRouter({ model, system, user, stream = false, temperature = 0.7, max_tokens = 6000 }) {
  const body = {
    model,
    stream,
    temperature,
    max_tokens,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user },
    ],
  };
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:' + PORT,
      'X-Title': 'Genial Skills Maestro',
    },
    body: JSON.stringify(body),
  });
  return res;
}

async function structureAssessmentWithAI(markdown, fallbackTitle = 'Examen interactivo') {
  const system = `Convierte examenes escolares en JSON interactivo.
Devuelve UNICAMENTE JSON valido, sin markdown.
Esquema:
{
  "title": "titulo",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "short_answer",
      "prompt": "texto de la pregunta sin respuesta",
      "choices": [{"id":"A","text":"opcion"}],
      "answer": "A o respuesta exacta",
      "points": 1
    }
  ]
}
Reglas:
- Conserva el idioma del examen.
- Conserva la notacion matematica en LaTeX tal como aparezca, incluyendo $...$, $$...$$, fracciones, exponentes y raices.
- Conserva imagenes en markdown como ![descripcion](url) dentro del prompt de la pregunta cuando existan.
- Si hay opciones A-D, usa multiple_choice y answer debe ser la letra correcta.
- Si no hay opciones, usa short_answer.
- No incluyas explicaciones ni hoja de respuestas dentro de prompt.
- Maximo 50 preguntas.`;

  const user = `Titulo sugerido: ${fallbackTitle}

Examen:
"""
${String(markdown || '').slice(0, 18000)}
"""`;

  const upstream = await callOpenRouter({
    model: 'openai/gpt-4o-mini',
    system,
    user,
    stream: false,
    temperature: 0.1,
    max_tokens: 5000,
  });
  if (!upstream.ok) {
    const text = await upstream.text();
    throw new Error(`No pude convertir el examen a interactivo: OpenRouter ${upstream.status}: ${text.slice(0, 300)}`);
  }
  const data = await upstream.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const parsed = extractJsonObject(content);
  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error('No pude convertir el examen a una estructura interactiva valida.');
  }
  return {
    title: parsed.title || fallbackTitle,
    questions: parsed.questions.slice(0, 50).map((q, index) => {
      const choices = Array.isArray(q.choices) ? q.choices : [];
      return {
        id: q.id || `q${index + 1}`,
        type: choices.length >= 2 ? 'multiple_choice' : 'short_answer',
        prompt: String(q.prompt || `Pregunta ${index + 1}`).trim(),
        choices: choices.map((c, i) => ({
          id: String(c.id || String.fromCharCode(65 + i)).toUpperCase().slice(0, 1),
          text: String(c.text || c.label || '').trim(),
        })).filter(c => c.text),
        answer: String(q.answer || '').trim(),
        points: Number(q.points || 1),
      };
    }),
  };
}

// SSE streaming endpoint
app.post('/api/generate', async (req, res) => {
  const { model, system, user, temperature, max_tokens } = req.body || {};
  if (!model || !user) {
    return res.status(400).json({ error: 'Missing model or user prompt' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const upstream = await callOpenRouter({ model, system, user, stream: true, temperature, max_tokens });
    if (!upstream.ok) {
      const text = await upstream.text();
      res.write(`data: ${JSON.stringify({ error: `OpenRouter ${upstream.status}: ${text}` })}\n\n`);
      return res.end();
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          return res.end();
        }
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content ?? '';
          if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        } catch { /* ignore keep-alives */ }
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: String(e) })}\n\n`);
    res.end();
  }
});

// Non-streaming compare endpoint — fans out to multiple models in parallel
app.post('/api/compare', async (req, res) => {
  const { models = [], system, user, temperature, max_tokens } = req.body || {};
  if (!Array.isArray(models) || !models.length || !user) {
    return res.status(400).json({ error: 'models[] and user are required' });
  }
  try {
    const results = await Promise.all(models.map(async (model) => {
      const t0 = Date.now();
      const r = await callOpenRouter({ model, system, user, stream: false, temperature, max_tokens });
      const json = await r.json();
      return {
        model,
        ok: r.ok,
        ms: Date.now() - t0,
        content: json?.choices?.[0]?.message?.content ?? '',
        usage: json?.usage,
        error: r.ok ? null : json,
      };
    }));
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/interactive-assessments', async (req, res) => {
  if (!requireSupabase(res)) return;
  const { title, subject = 'Matemáticas', grade, sourceTool = 'Examen de Matemáticas', markdown, values = {} } = req.body || {};
  if (!markdown || typeof markdown !== 'string') {
    return res.status(400).json({ error: 'markdown is required' });
  }

  try {
    let parsed = parseAssessmentMarkdown(markdown, title || sourceTool);
    if (!parsed.questions.length) {
      parsed = await structureAssessmentWithAI(markdown, title || sourceTool);
    }
    if (!parsed.questions.length) {
      return res.status(400).json({ error: 'No pude convertir el contenido a una evaluación interactiva. Intenta regenerar el examen o incluir preguntas claramente separadas.' });
    }

    const [assessment] = await supabaseRequest('assessments', {
      method: 'POST',
      prefer: 'return=representation',
      body: [{
        title: parsed.title,
        subject,
        grade: grade || values.grado || null,
        source_tool: sourceTool,
        markdown,
        questions: parsed.questions,
      }],
    });

    let session = null;
    for (let i = 0; i < 5 && !session; i++) {
      try {
        [session] = await supabaseRequest('assessment_sessions', {
          method: 'POST',
          prefer: 'return=representation',
          body: [{ assessment_id: assessment.id, code: makeSessionCode(), status: 'open' }],
        });
      } catch (e) {
        if (!/duplicate|unique/i.test(e.message) || i === 4) throw e;
      }
    }

    res.json({
      assessment,
      session,
      studentUrl: `/student/quiz/${session.code}`,
      teacherUrl: `/teacher/session/${session.code}`,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

function mapPlanningRow(row) {
  return {
    PlanId: row.id,
    PlanName: row.plan_name,
    SubjectName: row.subject_name,
    LevelCode: row.level_code,
    GroupName: row.group_name,
    OpenDate: row.open_date,
    CloseDate: row.close_date,
    WeekNumber: row.week_number || '209',
    PeriodLabel: row.period_label,
    AcademicYear: row.academic_year,
    ClosesOn: row.closes_on,
    IsPlanOpen: row.is_plan_open,
    Lessons: row.lessons || [],
    SectionData: row.section_data || {},
  };
}

function planningBody(body = {}) {
  return {
    plan_name: body.PlanName || body.planName || 'Nuevo Plan',
    subject_name: body.SubjectName || body.subjectName || 'Ciencias',
    level_code: body.LevelCode || body.levelCode || '5',
    group_name: body.GroupName || body.groupName || null,
    open_date: body.OpenDate || body.openDate || null,
    close_date: body.CloseDate || body.closeDate || null,
    week_number: body.WeekNumber || body.weekNumber || '209',
    period_label: body.PeriodLabel || body.periodLabel || null,
    academic_year: body.AcademicYear || body.academicYear || null,
    closes_on: body.ClosesOn || body.closesOn || null,
    is_plan_open: body.IsPlanOpen ?? body.isPlanOpen ?? true,
    lessons: Array.isArray(body.Lessons) ? body.Lessons : [],
    section_data: body.SectionData && typeof body.SectionData === 'object' ? body.SectionData : {},
  };
}

function mapAssignmentRow(row) {
  return {
    Id: row.id,
    Title: row.title,
    Published: row.published,
    CreatedAt: row.created_at,
    Questions: row.questions || [],
  };
}

function mapDocumentRow(row) {
  return {
    id: row.id,
    title: row.title,
    toolTitle: row.tool_title,
    category: row.category,
    kind: row.kind,
    model: row.model,
    content: row.content,
    prompt: row.prompt,
    values: row.values || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assignmentBody(body = {}) {
  return {
    title: body.Title || body.title || 'Nueva asignacion',
    published: body.Published ?? body.published ?? true,
    questions: Array.isArray(body.Questions) ? body.Questions : (Array.isArray(body.questions) ? body.questions : []),
  };
}

function documentBody(body = {}) {
  const now = new Date().toISOString();
  return {
    id: String(body.id || `doc_${Date.now()}`),
    title: body.title || body.toolTitle || 'Documento IA',
    tool_title: body.toolTitle || body.title || 'Herramienta IA',
    category: body.category || 'ia',
    kind: body.kind || 'markdown',
    model: body.model || '',
    content: String(body.content || ''),
    prompt: body.prompt || '',
    values: body.values && typeof body.values === 'object' ? body.values : {},
    created_at: body.createdAt || now,
    updated_at: body.updatedAt || now,
  };
}

app.get('/api/plannings', async (_req, res) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.json({ plans: [], source: 'local', warning: 'Supabase is not configured.' });
  }
  try {
    const rows = await supabaseRequest('teacher_plannings', { query: '?order=updated_at.desc' });
    res.json({ plans: (rows || []).map(mapPlanningRow) });
  } catch (e) {
    console.warn('[plannings] Falling back to local-only mode:', e.message || e);
    res.json({ plans: [], source: 'local', warning: String(e.message || e) });
  }
});

app.get('/api/assignments', async (_req, res) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.json({ assignments: [], source: 'local', warning: 'Supabase is not configured.' });
  }
  try {
    const rows = await supabaseRequest('teacher_assignments', { query: '?order=created_at.desc' });
    res.json({ assignments: (rows || []).map(mapAssignmentRow) });
  } catch (e) {
    console.warn('[assignments] Falling back to local-only mode:', e.message || e);
    res.json({ assignments: [], source: 'supabase-error', warning: String(e.message || e) });
  }
});

app.get('/api/documents', async (_req, res) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.json({ documents: [], source: 'local', warning: 'Supabase is not configured.' });
  }
  try {
    const rows = await supabaseRequest('teacher_documents', { query: '?order=updated_at.desc' });
    res.json({ documents: (rows || []).map(mapDocumentRow) });
  } catch (e) {
    console.warn('[documents] Falling back to local-only mode:', e.message || e);
    res.json({ documents: [], source: 'supabase-error', warning: String(e.message || e) });
  }
});

app.post('/api/documents', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const [row] = await supabaseRequest('teacher_documents', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: [documentBody(req.body)],
    });
    res.json({ document: mapDocumentRow(row) });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.patch('/api/documents/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const id = String(req.params.id || '');
    const body = documentBody({ ...req.body, id });
    delete body.created_at;
    const [row] = await supabaseRequest('teacher_documents', {
      method: 'PATCH',
      query: `?id=eq.${encodeURIComponent(id)}`,
      prefer: 'return=representation',
      body,
    });
    if (!row) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json({ document: mapDocumentRow(row) });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const id = String(req.params.id || '');
    await supabaseRequest('teacher_documents', {
      method: 'DELETE',
      query: `?id=eq.${encodeURIComponent(id)}`,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post('/api/assignments', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const [row] = await supabaseRequest('teacher_assignments', {
      method: 'POST',
      prefer: 'return=representation',
      body: [assignmentBody(req.body)],
    });
    res.json({ assignment: mapAssignmentRow(row) });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post('/api/plannings', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const [row] = await supabaseRequest('teacher_plannings', {
      method: 'POST',
      prefer: 'return=representation',
      body: [planningBody(req.body)],
    });
    res.json({ plan: mapPlanningRow(row) });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.patch('/api/plannings/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const id = String(req.params.id || '');
    const [row] = await supabaseRequest('teacher_plannings', {
      method: 'PATCH',
      query: `?id=eq.${encodeURIComponent(id)}`,
      prefer: 'return=representation',
      body: planningBody(req.body),
    });
    if (!row) return res.status(404).json({ error: 'Planificacion no encontrada' });
    res.json({ plan: mapPlanningRow(row) });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/api/sessions/:code', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const code = String(req.params.code || '').toUpperCase();
    const sessions = await supabaseRequest('assessment_sessions', {
      query: `?code=eq.${encodeURIComponent(code)}&limit=1`,
    });
    const session = sessions?.[0];
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    const assessments = await supabaseRequest('assessments', {
      query: `?id=eq.${encodeURIComponent(session.assessment_id)}&limit=1`,
    });
    res.json({ session, assessment: assessments?.[0] || null });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post('/api/sessions/:code/responses', async (req, res) => {
  if (!requireSupabase(res)) return;
  const { studentName, studentIdentifier, answers } = req.body || {};
  if (!studentName || !answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'studentName and answers are required' });
  }
  try {
    const code = String(req.params.code || '').toUpperCase();
    const sessions = await supabaseRequest('assessment_sessions', {
      query: `?code=eq.${encodeURIComponent(code)}&limit=1`,
    });
    const session = sessions?.[0];
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (session.status !== 'open') return res.status(409).json({ error: 'Esta sesión ya no acepta respuestas' });

    const assessments = await supabaseRequest('assessments', {
      query: `?id=eq.${encodeURIComponent(session.assessment_id)}&limit=1`,
    });
    const assessment = assessments?.[0];
    const result = scoreAnswers(assessment?.questions || [], answers);
    const [response] = await supabaseRequest('session_responses', {
      method: 'POST',
      prefer: 'return=representation',
      body: [{
        session_id: session.id,
        student_name: studentName,
        student_identifier: studentIdentifier || null,
        answers,
        score: result.score,
        max_score: result.max,
      }],
    });

    res.json({ response, score: result.score, maxScore: result.max });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/api/sessions/:code/results', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const code = String(req.params.code || '').toUpperCase();
    const sessions = await supabaseRequest('assessment_sessions', {
      query: `?code=eq.${encodeURIComponent(code)}&limit=1`,
    });
    const session = sessions?.[0];
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    const [assessments, responses] = await Promise.all([
      supabaseRequest('assessments', { query: `?id=eq.${encodeURIComponent(session.assessment_id)}&limit=1` }),
      supabaseRequest('session_responses', { query: `?session_id=eq.${encodeURIComponent(session.id)}&order=submitted_at.desc` }),
    ]);
    res.json({ session, assessment: assessments?.[0] || null, responses: responses || [] });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Weekly plans index — list with optional subject/scope/kind filters
let _plansIndex = null;
let _fewshot = null;
let _curriculumUnits = null;
async function loadPlansIndex() {
  if (_plansIndex) return _plansIndex;
  const raw = await import('node:fs/promises').then(m => m.readFile(path.join(__dirname, 'weekly-plans-index.json'), 'utf8'));
  _plansIndex = JSON.parse(raw);
  return _plansIndex;
}
async function loadCurriculumUnitsFile() {
  if (_curriculumUnits) return _curriculumUnits;
  const units = [];
  try {
    const fs = await import('node:fs/promises');
    const candidates = [
      path.join(__dirname, 'public', 'data', 'units.json'),
      path.join(__dirname, 'dist', 'data', 'units.json'),
      path.join(__dirname, 'public', 'data', 'curriculum-units.generated.json'),
      path.join(__dirname, 'dist', 'data', 'curriculum-units.generated.json'),
    ];
    for (const filePath of candidates) {
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.units)) units.push(...parsed.units);
      } catch {}
    }
  } catch {}
  _curriculumUnits = units;
  return _curriculumUnits;
}
async function loadFewshot() {
  if (_fewshot) return _fewshot;
  try {
    const raw = await import('node:fs/promises').then(m => m.readFile(path.join(__dirname, 'standards', 'fewshot-plans.json'), 'utf8'));
    _fewshot = JSON.parse(raw);
  } catch { _fewshot = []; }
  return _fewshot;
}

function normalizeCurriculumText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const SUBJECT_ALIASES = {
  matematica: 'matematicas',
  matematicas: 'matematicas',
  math: 'matematicas',
  mathematics: 'matematicas',
  ciencias: 'ciencias',
  science: 'ciencias',
  sociales: 'estudios sociales',
  'estudios sociales': 'estudios sociales',
  'ciencias sociales': 'estudios sociales',
  'social studies': 'estudios sociales',
  ingles: 'ingles',
  english: 'ingles',
  ela: 'ingles',
  espanol: 'espanol',
  spanish: 'espanol',
  'artes del lenguaje': 'espanol',
};

function normalizeSubjectName(value) {
  const normalized = normalizeCurriculumText(value);
  return SUBJECT_ALIASES[normalized] || normalized;
}

function normalizeGradeCode(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (/^(k|kindergarten|kinder|pre-k|prek|pk|p)$/.test(raw)) return raw.startsWith('pre') || raw === 'pk' || raw === 'p' ? 'pk' : 'k';
  return raw.replace(/\D/g, '');
}

function unitSortValue(unit) {
  const text = String(unit?.code || unit?.unit || unit?.id || '');
  const number = Number(text.match(/\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(number) ? number : 999;
}

function findFewshotExample(examples = [], subject, grade) {
  const selectedSubject = normalizeSubjectName(subject);
  const selectedGrade = normalizeGradeCode(grade);
  const sameSubject = examples.filter(example => normalizeSubjectName(example.subject) === selectedSubject);
  if (!sameSubject.length) return examples[0] || null;
  return sameSubject.find(example => normalizeGradeCode(example.scope || example.grade) === selectedGrade) || sameSubject[0];
}

/**
 * Map an internal file path to a public URL.
 * When WEEKLY_PLANS_BASE_URL is set (production with Cloudflare R2 bucket), files
 * are served from that bucket. Otherwise from local static mounts (dev).
 *
 * R2 bucket layout (mirror the local structure):
 *   {WEEKLY_PLANS_BASE_URL}/planes-semanales/<path>
 *   {WEEKLY_PLANS_BASE_URL}/bellas-artes/<path>
 *   {WEEKLY_PLANS_BASE_URL}/estudios-sociales/<path>
 */
const R2_BASE = (process.env.WEEKLY_PLANS_BASE_URL || '').replace(/\/$/, '');

function publicUrl(relPath) {
  const base = R2_BASE || '';
  if (relPath.startsWith('Planes semanales/')) {
    const rest = encodeURI(relPath.slice('Planes semanales/'.length));
    return base ? `${base}/planes-semanales/${rest}` : `/plans-files/planes-semanales/${rest}`;
  }
  if (relPath.startsWith('BELLAS ARTES-')) {
    const rest = encodeURI(relPath.split('/').slice(1).join('/'));
    return base ? `${base}/bellas-artes/${rest}` : `/plans-files/bellas-artes/${rest}`;
  }
  if (relPath.startsWith('Estudios sociales-Planes semanales/')) {
    const rest = encodeURI(relPath.slice('Estudios sociales-Planes semanales/'.length));
    return base ? `${base}/estudios-sociales/${rest}` : `/plans-files/estudios-sociales/${rest}`;
  }
  return null;
}

app.get('/api/weekly-plans', async (req, res) => {
  try {
    const idx = await loadPlansIndex();
    let list = idx;
    const { subject, scope, kind, unit } = req.query;
    if (subject) list = list.filter(p => (p.subject || '').toLowerCase() === String(subject).toLowerCase());
    if (scope)   list = list.filter(p => (p.scope || '')   === String(scope));
    if (kind)    list = list.filter(p => p.kind === String(kind));
    if (unit) {
      const unitText = String(unit);
      const unitMajor = unitText.split(/[._-]/).filter(Boolean).pop() || unitText;
      const unitPrefix = unitText.split('.')[0];
      list = list.filter(p => {
        const planUnit = String(p.unit || '');
        return planUnit === unitText || planUnit === unitMajor || planUnit === unitPrefix;
      });
    }
    list = list.map(p => ({ ...p, url: publicUrl(p.path) }));
    // also surface available facets so the UI can build dropdowns
    const facets = {
      subjects: [...new Set(idx.map(p => p.subject).filter(Boolean))].sort(),
      scopes:   [...new Set(idx.map(p => p.scope).filter(Boolean))].sort(),
      kinds:    [...new Set(idx.map(p => p.kind).filter(Boolean))].sort(),
    };
    res.json({ count: list.length, facets, plans: list });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/curriculum-units', async (req, res) => {
  try {
    const [curated, idx] = await Promise.all([loadCurriculumUnitsFile(), loadPlansIndex()]);
    const { subject, grade, scope } = req.query;
    const selectedSubject = normalizeSubjectName(subject);
    const selectedGrade = normalizeGradeCode(grade || scope);
    const byId = new Map();

    for (const unit of curated) {
      const unitSubject = normalizeSubjectName(unit.subject);
      const unitGrade = normalizeGradeCode(unit.grade);
      if (selectedSubject && unitSubject !== selectedSubject) continue;
      if (selectedGrade && unitGrade !== selectedGrade) continue;
      const id = unit.id || `${unitSubject}_${unitGrade}_${unit.code || unit.unit || byId.size + 1}`;
      byId.set(id, { ...unit, id, source: 'curated' });
    }

    for (const plan of idx) {
      const unitNumber = String(plan.unit || '').trim();
      if (!unitNumber) continue;
      const planSubject = normalizeSubjectName(plan.subject);
      const planGrade = normalizeGradeCode(plan.scope);
      if (selectedSubject && planSubject !== selectedSubject) continue;
      if (selectedGrade && planGrade !== selectedGrade) continue;

      const matchingCurated = [...byId.values()].find(unit => {
        const unitTail = String(unit.code || unit.unit || '').split(/[._-]/).filter(Boolean).pop();
        return unitTail === unitNumber;
      });
      if (matchingCurated) {
        matchingCurated.resourcesCount = (matchingCurated.resourcesCount || 0) + 1;
        continue;
      }

      const id = `IDX_${planSubject}_${planGrade}_${unitNumber}`.replace(/\s+/g, '_');
      if (byId.has(id)) {
        const existing = byId.get(id);
        existing.resourcesCount = (existing.resourcesCount || 0) + 1;
        continue;
      }
      byId.set(id, {
        id,
        code: unitNumber,
        subject: plan.subject,
        grade: plan.scope,
        title: `Unidad ${unitNumber}`,
        weeks: null,
        startWeek: null,
        endWeek: null,
        transferObjectives: [],
        acquisitionObjectives: [],
        essentialQuestions: [],
        standards: [],
        themes: [],
        vocabulary: [],
        resources: [],
        resourcesCount: 1,
        source: 'weekly-plans-index',
      });
    }

    const units = [...byId.values()].sort((a, b) => unitSortValue(a) - unitSortValue(b) || String(a.title).localeCompare(String(b.title)));
    res.json({ count: units.length, units });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e), units: [] });
  }
});

// Athenas lessons — local cache of /lessons/advance responses.
// Drop JSON files into /athenas-cache/ and we serve them filtered by subject + grade.
let _athenasIndex = null;
async function loadAthenasIndex() {
  if (_athenasIndex) return _athenasIndex;
  const dir = path.join(__dirname, 'athenas-cache');
  const fsm = await import('node:fs/promises');
  let files = [];
  try { files = await fsm.readdir(dir); } catch { return (_athenasIndex = []); }
  const all = [];
  for (const f of files) {
    if (!f.toLowerCase().endsWith('.json')) continue;
    try {
      const raw = await fsm.readFile(path.join(dir, f), 'utf8');
      const json = JSON.parse(raw);
      // Accept either an array of lessons or an object with .lessons / .Data
      const arr = Array.isArray(json) ? json :
                  Array.isArray(json.lessons) ? json.lessons :
                  Array.isArray(json.Data) ? json.Data :
                  Array.isArray(json.data) ? json.data : [];
      for (const lesson of arr) {
        all.push({
          id: lesson.Id || lesson.id || lesson.LessonId,
          title: lesson.LessonTitle || lesson.Title || lesson.title || lesson.Name,
          subjectCode: lesson.SubjectCode || lesson.subjectCode || lesson.subject,
          levelCode:   lesson.LevelCode   || lesson.levelCode   || lesson.grade,
          standard:    lesson.std || lesson.standard || lesson.StandardCode,
          objective:   lesson.Objective || lesson.objective || lesson.Description || '',
          raw: lesson,
        });
      }
    } catch (e) {
      console.warn(`Skip ${f}: ${e.message}`);
    }
  }
  _athenasIndex = all;
  console.log(`Loaded ${all.length} Athenas lessons from cache`);
  return all;
}

app.get('/api/athenas-lessons', async (req, res) => {
  try {
    const lessons = await loadAthenasIndex();
    let list = lessons;
    const { subject, grade, q } = req.query;
    if (subject) list = list.filter(l => (l.subjectCode || '').toLowerCase().includes(String(subject).toLowerCase()));
    if (grade)   list = list.filter(l => String(l.levelCode || '') === String(grade));
    if (q) {
      const term = String(q).toLowerCase();
      list = list.filter(l =>
        (l.title || '').toLowerCase().includes(term) ||
        (l.objective || '').toLowerCase().includes(term) ||
        (l.standard || '').toLowerCase().includes(term)
      );
    }
    res.json({ count: list.length, lessons: list.slice(0, 200) });  // cap to 200 results
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Few-shot examples used by Plan My Lesson — filter by subject+scope (optional)
app.get('/api/fewshot-plans', async (req, res) => {
  try {
    const fs = await loadFewshot();
    let list = fs;
    const { subject, scope } = req.query;
    if (subject) list = list.filter(p => normalizeSubjectName(p.subject) === normalizeSubjectName(subject));
    if (scope)   list = list.filter(p => normalizeGradeCode(p.scope) === normalizeGradeCode(scope));
    res.json({ count: list.length, examples: list });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/standards', async (req, res) => {
  try {
    const codes = req.query.codes ? String(req.query.codes).split(',').map(s => s.trim()).filter(Boolean) : undefined;
    const list = await getStandards({ subject: req.query.subject, grade: req.query.grade, codes });
    res.json({ count: list.length, standards: list });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// File upload → text extraction (PDF, DOCX, plain text). Max 10MB.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/extract-text', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { mimetype, originalname, buffer, size } = req.file;
  const ext = (originalname.split('.').pop() || '').toLowerCase();
  try {
    let text = '';
    if (ext === 'pdf' || mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else if (ext === 'txt' || mimetype === 'text/plain') {
      text = buffer.toString('utf8');
    } else {
      return res.status(415).json({ error: `Tipo de archivo no soportado: ${ext || mimetype}. Usa PDF, DOCX o TXT.` });
    }
    text = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    res.json({ filename: originalname, bytes: size, chars: text.length, text });
  } catch (e) {
    res.status(500).json({ error: 'No pude extraer texto del archivo: ' + (e.message || e) });
  }
});

/**
 * Robust JSON extractor: strips ```json fences, finds the JSON object,
 * and tolerates trailing truncation by closing unbalanced brackets.
 */
function extractPlanJSON(text) {
  if (!text) return null;
  // Strip ```json ... ``` fences if present
  let s = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // Find the first '{'
  const start = s.indexOf('{');
  if (start < 0) return null;
  s = s.slice(start);
  // Try a direct parse first
  try { return JSON.parse(s); } catch {}
  // Walk the string tracking brackets + strings to find the largest valid prefix
  let depth = 0, inStr = false, esc = false, lastValid = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) lastValid = i + 1;
    }
  }
  if (lastValid > 0) {
    try { return JSON.parse(s.slice(0, lastValid)); } catch {}
  }
  // Last resort: truncate unfinished string + close all open brackets
  let truncated = s;
  // If we ended mid-string, cut back to the last comma or last closing brace
  if (inStr) {
    const cut = Math.max(truncated.lastIndexOf('",'), truncated.lastIndexOf('"}'));
    if (cut > 0) truncated = truncated.slice(0, cut + 2);
  }
  // Re-balance brackets
  let open = 0;
  for (const ch of truncated) {
    if (ch === '{') open++;
    else if (ch === '}') open--;
  }
  truncated = truncated.replace(/,\s*$/, '') + '}'.repeat(Math.max(0, open));
  try { return JSON.parse(truncated); } catch {}
  return null;
}

function plainTextFromHtml(value = '') {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseUSDate(value) {
  const m = String(value || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const date = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatUSDate(date) {
  return [
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

function formatUSDateFromAny(value) {
  const parsed = parseUSDate(value);
  return parsed ? formatUSDate(parsed) : String(value || '');
}

function datesBetweenInclusive(dateFrom, dateTo) {
  const start = parseUSDate(dateFrom);
  const end = parseUSDate(dateTo);
  if (!start || !end || end < start) return [];
  const days = [];
  const cursor = new Date(start);
  while (cursor <= end && days.length < 14) {
    days.push(formatUSDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function pickDistributedDate(days, index, total) {
  if (!days.length) return '';
  if (total <= 1) return days[0];
  const slot = Math.round((index * (days.length - 1)) / (total - 1));
  return days[Math.max(0, Math.min(days.length - 1, slot))];
}

function normalizeSectionDates(sections, validDays) {
  if (!sections || typeof sections !== 'object' || !validDays.length) return sections;
  const valid = new Set(validDays);
  const normalizeDates = (dates) => {
    if (!dates || typeof dates !== 'object') return { wholeWeek: true, days: validDays };
    if (dates.wholeWeek) return { ...dates, wholeWeek: true, days: validDays };
    const days = Array.isArray(dates.days)
      ? dates.days.map(formatUSDateFromAny).filter(day => valid.has(day))
      : [];
    return days.length ? { ...dates, wholeWeek: false, days } : { wholeWeek: true, days: validDays };
  };
  const next = {};
  for (const [key, value] of Object.entries(sections)) {
    if (Array.isArray(value)) {
      next[key] = value.map(entry => (
        entry && typeof entry === 'object' ? { ...entry, dates: normalizeDates(entry.dates) } : entry
      ));
    } else {
      next[key] = value;
    }
  }
  return next;
}

function normalizeGeneratedPlan(plan, { dateFrom, dateTo, standards = [] } = {}) {
  const days = datesBetweenInclusive(dateFrom, dateTo);
  const lessons = Array.isArray(plan?.lessons) ? plan.lessons : [];
  const expectationByCode = new Map(
    standards
      .map(s => [String(s.code || '').trim().toLowerCase(), s.expectation || s.description || ''])
      .filter(([code]) => code)
  );
  const normalizedLessons = lessons.map((lesson, index) => {
    const standardCodes = Array.isArray(lesson.standards)
      ? lesson.standards
      : String(lesson.standardCode || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
    const firstCode = String(lesson.standardCode || standardCodes[0] || '').trim();
    const matchedExpectation = expectationByCode.get(firstCode.toLowerCase()) || '';
    const startDate = days.length
      ? pickDistributedDate(days, index, lessons.length)
      : formatUSDateFromAny(lesson.startDate || dateFrom);
    const startIdx = days.indexOf(startDate);
    const evaluationDate = days.length && startIdx >= 0
      ? days[Math.min(days.length - 1, startIdx + 1)]
      : formatUSDateFromAny(lesson.evaluationDate || startDate);
    return {
      ...lesson,
      standardCode: firstCode,
      standards: standardCodes.length ? standardCodes : (firstCode ? [firstCode] : []),
      expectations: lesson.expectations || lesson.expectation || matchedExpectation,
      startDate,
      endDate: startDate,
      evaluationDate,
    };
  });
  return {
    ...plan,
    lessons: normalizedLessons,
    sections: normalizeSectionDates(plan?.sections, days),
  };
}

/**
 * /api/generate-full-plan — Genera un plan semanal completo combinando:
 *   - Estándares DEPR de la materia + grado
 *   - Lecciones de Athenas (si hay cache para la materia + grado)
 *   - Un plan few-shot de referencia
 * Devuelve JSON estructurado con lecciones + contenido por cada sección del cotejo.
 *
 * Body: { subject, grade, unit, weeks?, lessonsHint?, dateFrom?, dateTo?, model?, schoolImprovementPlan? }
 */
app.post('/api/generate-full-plan', async (req, res) => {
  const { subject, grade, unit, weeks = 1, lessonsHint, dateFrom, dateTo, model = 'anthropic/claude-haiku-4.5', schoolImprovementPlan = false } = req.body || {};
  if (!subject || !grade || !unit) {
    return res.status(400).json({ error: 'subject, grade y unit son requeridos' });
  }

  try {
    // 1) Gather DEPR standards for this subject+grade
    const standards = await getStandards({ subject, grade }).catch(() => []);
    const standardsBlock = standards.length
      ? standards.slice(0, 40).map(s => `- **${s.code}** — ${s.expectation}`).join('\n')
      : 'No hay estándares cargados para esta materia/grado.';

    // 2) Try to grab matching Athenas lessons. Live API first if token supplied,
    //    otherwise fall back to the local cache (athenas-cache/*.json).
    const ATHENAS_SUBJECT_MAP = {
      'matemáticas':       ['mat-sp', 'mat-en'],
      'matematicas':       ['mat-sp', 'mat-en'],
      'ciencias':          ['sci-sp', 'sci-en', 'bi-sp', 'qu-sp', 'fi-sp'],
      'español':           ['sp'],
      'espanol':           ['sp'],
      'español / lenguaje':['sp'],
      'inglés':            ['en'],
      'ingles':            ['en'],
      'inglés / ela':      ['en'],
      'estudios sociales': ['sci-so', 'his-sp'],
      'biología':          ['bi-sp'],
      'biologia':          ['bi-sp'],
      'química':           ['qu-sp'],
      'quimica':           ['qu-sp'],
      'álgebra':           ['a1-sp', 'a2-sp'],
      'algebra':           ['a1-sp', 'a2-sp'],
      'geometría':         ['geo-sp'],
      'geometria':         ['geo-sp'],
    };
    const subjectCodes = ATHENAS_SUBJECT_MAP[(subject || '').toLowerCase()] || [];
    const gradeNorm    = String(grade).replace(/[^\dKkPp]/g, '').toLowerCase();
    const athenasToken = req.body?.athenasToken || req.get?.('x-athenas-token') || null;

    let subjMatches = [];
    let athenasSource = 'cache';

    if (athenasToken && subjectCodes.length) {
      try {
        const upstream = await fetch(`${BASEAPI_BASE}/teachersapi/lessons/advance`, {
          method: 'POST',
          headers: { 'token': athenasToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            SubjectCodes:        subjectCodes,
            LevelCodes:          gradeNorm ? [gradeNorm] : [],
            StandardCodes:       [],
            ExpectationCodes:    [],
            PageNumber:          0,
            ContentFilter:       '',
            Limit:               30,
            OrderByCreationDate: true,
            OrderByTitle:        null,
            TeacherInputText:    unit?.slice(0, 60) || '',
          }),
        });
        if (upstream.ok) {
          const data = await upstream.json();
          const liveLessons = data?.LessonsDetails?.Lessons || [];
          subjMatches = liveLessons.map(L => ({
            id:          L.LessonModel?.Id,
            title:       L.LessonModel?.LessonTitle,
            subjectCode: L.LessonModel?.SubjectCode,
            levelCode:   L.LessonModel?.LevelCode,
            standard:    L.LessonStandardModelList?.[0]?.Code || null,
            objective:   L.LessonStandardModelList?.[0]?.Description || '',
            description: plainTextFromHtml(L.LessonDetailModel?.Description || ''),
            objectives:  (L.LessonObjectiveModelList || []).map(o => plainTextFromHtml(o.Desc || o.Description || '')).filter(Boolean),
            strategies:  (L.LessonStrategyModelList || []).map(s => plainTextFromHtml(s.Desc || s.Description || '')).filter(Boolean),
          }));
          if (subjMatches.length) athenasSource = 'live';
        }
      } catch (_) { /* fall through to cache */ }
    }

    if (!subjMatches.length) {
      const athenasList = await loadAthenasIndex().catch(() => []);
      subjMatches = athenasList.filter(l => {
        const code = (l.subjectCode || '').toLowerCase();
        const lvl  = String(l.levelCode || '').toLowerCase();
        const subjMatch = subjectCodes.length
          ? subjectCodes.includes(code)
          : code.includes((subject || '').slice(0, 3).toLowerCase());
        const gradeMatch = !gradeNorm || lvl === gradeNorm;
        return subjMatch && gradeMatch;
      }).slice(0, 30);
    }
    const athenasBlock = subjMatches.length
      ? subjMatches.map(l => {
          const parts = [
            `- "${l.title}"${l.standard ? ` (${l.standard})` : ''}`,
            l.objective ? `Estándar/expectativa: ${l.objective.slice(0, 180)}` : '',
            l.description ? `Descripción Athenas: ${l.description.slice(0, 900)}` : '',
            l.objectives?.length ? `Objetivos de la lección: ${l.objectives.slice(0, 4).join(' | ').slice(0, 500)}` : '',
            l.strategies?.length ? `Estrategias: ${l.strategies.slice(0, 3).join(' | ').slice(0, 400)}` : '',
          ].filter(Boolean);
          return parts.join('\n  ');
        }).join('\n')
      : 'No hay lecciones de Athenas en cache para esta combinación. Sugiere títulos apropiados.';

    // 3) Few-shot example
    const fewshot = await loadFewshot().catch(() => []);
    const example = findFewshotExample(fewshot, subject, grade);
    const exampleBlock = example
      ? `## Ejemplo de plan DEPR real del distrito (referencia de formato/estilo)\nMateria: ${example.subject} · Grado ${example.scope}\n\n"""\n${example.text.slice(0, 2200)}\n"""`
      : '';
    const improvementSectionsSchema = schoolImprovementPlan
      ? `    "fl-plan1":    [{ "dates": { "wholeWeek": true }, "modos": ["Practica guiada"], "incluye": ["Respuesta activa del estudiante"] }],
    "fl-plan2":    [{ "dates": { "wholeWeek": true }, "text": "Experiencia comun de 2 a 3 minutos..." }],`
      : '';
    const improvementInstruction = schoolImprovementPlan
      ? 'La escuela ESTA en plan de mejoramiento. Debes completar fl-plan1 y fl-plan2 con estrategias concretas, observables y alineadas al tema semanal.'
      : 'La escuela NO esta en plan de mejoramiento. No incluyas fl-plan1 ni fl-plan2 en el JSON de sections; deja esas dos areas sin trabajar.';

    const system = `Eres un asistente experto en planificación instruccional del Departamento de Educación de Puerto Rico (DEPR).
Tu tarea: generar un plan semanal completo en formato Cotejo de Planificación, listo para entregarse.

## Estándares DEPR disponibles para ${subject} ${grade}
Selecciona los que mejor apliquen al tema y cítalos por código en las secciones que correspondan.

${standardsBlock}

## Lecciones disponibles en el catálogo del distrito
Cuando sea apropiado, recomienda lecciones de esta lista. Cuando no haya una que aplique, sugiere un título nuevo apropiado.

${athenasBlock}

${exampleBlock}

## Formato de respuesta (JSON puro, sin markdown fences)
{
  "lessons": [
    {
      "title": "Título de la lección",
      "objective": "Objetivo de aprendizaje",
      "standardCode": "5.CT2.1",
      "expectations": "Texto completo de la expectativa DEPR correspondiente al standardCode",
      "startDate": "MM/DD/YYYY",
      "endDate": "MM/DD/YYYY",
      "evaluationDate": "MM/DD/YYYY",
      "duration": "45 min",
      "countsForGrade": true,
      "startActivity": "Actividad de inicio tomada o adaptada de la Descripcion de Athenas",
      "devActivity": "Actividad de desarrollo tomada o adaptada de la Descripcion de Athenas",
      "endActivity": "Actividad de cierre tomada o adaptada de la Descripcion de Athenas"
    }
  ],
  "sections": {
    "gl-lessons":  "Resumen de qué lecciones se cubren y por qué",
    "gl-forums":   [{ "dates": { "wholeWeek": true }, "titulo": "Foro de discusion", "descripcion": "Prompt inicial..." }],
    "fl-lessons":  "Lecciones libres complementarias",
    "fl-integ":    [{ "dates": { "wholeWeek": true }, "materias": ["Matematicas"] }],
    "fl-innov":    [{ "dates": { "wholeWeek": true }, "tipos": ["STEM"] }],
    "fl-eval":     [{ "dates": { "wholeWeek": true }, "diagnostica": ["Preprueba"], "formativa": ["Lista de cotejo"], "sumativa": ["Prueba corta"] }],
    "fl-acom":     [{ "dates": { "wholeWeek": true }, "categoriaAcomodo": "LSP", "acomodos": ["Uso de apoyos visuales y traduccion"] }],
    "fl-strat":    [{ "dates": { "wholeWeek": true }, "categoria": "Proceso", "tipo": "Grupos de trabajo flexibles" }],
${improvementSectionsSchema}
    "fl-mats":     [{ "dates": { "wholeWeek": true }, "materiales": ["Texto del curso", "Recursos tecnologicos (materiales/equipo)"] }],
    "fl-obs":      [{ "dates": { "wholeWeek": true }, "text": "Observaciones / notas para el maestro" }],
    "fl-reflex":   [{ "dates": { "wholeWeek": true }, "incluirReflexion": "Si", "text": "Reflexion de praxis..." }]
  }
}

Las secciones que en la plataforma son checkboxes, radios o selects DEBEN devolverse como arreglos de objetos estructurados, no como parrafos. Usa solamente estas llaves para esas secciones:
- fl-integ: materias[]
- fl-innov: tipos[]
- fl-eval: diagnostica[], formativa[], sumativa[]
- fl-acom: categoriaAcomodo, acomodos[]
- fl-strat: categoria, tipo, otroTipo opcional
- fl-plan1: modos[], incluye[]
- fl-mats: materiales[]
- fl-reflex: incluirReflexion, text
- fl-obs: text
- gl-forums: titulo, descripcion
No incluyas gl-tasks si no tienes IDs reales de asignaciones existentes.

Responde ÚNICAMENTE con el JSON. Sin explicaciones antes ni después. Sin markdown.`;

    const timingRuleClean = 'Para cada leccion, la evaluationDate debe ser posterior a startDate: idealmente el proximo dia lectivo, o dos dias despues si la semana queda muy cargada. Nunca pongas una prueba, quiz o avaluo antes del dia en que se discute la leccion; solo usa el mismo dia si la leccion cae el ultimo dia del rango y no existe un dia posterior disponible.';

    const user = `Genera el plan completo para esta unidad:

Materia: ${subject}
Grado: ${grade}
${dateFrom && dateTo ? `Período: ${dateFrom} al ${dateTo}` : ''}
Cantidad de semanas: ${weeks}

Unidad / tema a trabajar:
${unit}

Regla obligatoria de fechas para pruebas y avaluos:
${timingRuleClean}

Regla obligatoria de calendario:
Usa solamente fechas entre ${dateFrom || 'la fecha inicial'} y ${dateTo || 'la fecha final'} inclusive. No inventes sabados, domingos ni fechas fuera del rango. Distribuye las lecciones proporcionalmente en ese rango; si hay menos lecciones que dias, deja dias sin leccion antes de repetir o rellenar.

Regla obligatoria de expectativas:
Cada leccion debe incluir "standardCode" y "expectations". "expectations" debe ser el texto completo de la expectativa DEPR asociada al codigo seleccionado, no una estrategia ni una actividad.

Regla obligatoria para actividades de la leccion:
Si una leccion recomendada viene de Athenas y tiene "Descripcion Athenas", analiza esa descripcion para llenar startActivity, devActivity y endActivity. Usa contenido textual concreto de esa descripcion cuando existan actividades claras; si el texto no trae una division explicita, infiere Inicio, Desarrollo y Cierre sin inventar contenido ajeno al tema.

Regla obligatoria para plan de mejoramiento:
${improvementInstruction}

${lessonsHint ? `Lecciones específicas que el maestro quiere incluir o priorizar:\n${lessonsHint}` : 'El maestro no especificó lecciones — recomiéndaselas tú basándote en el catálogo y los estándares.'}

Sugiere ${Math.max(3, Math.min(8, weeks * 3))} lecciones distribuidas en el rango de fechas. Llena TODAS las secciones del cotejo con contenido específico, accionable y aterrizado a Puerto Rico.`;

    // Use OpenRouter non-streaming so we get clean JSON back at once
    const upstream = await callOpenRouter({
      model,
      system,
      user,
      stream: false,
      temperature: 0.5,
      max_tokens: 8000,
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(502).json({ error: `OpenRouter ${upstream.status}: ${text}` });
    }
    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content || '';

    const plan = extractPlanJSON(content);
    if (!plan) {
      return res.status(502).json({ error: 'El modelo no devolvió JSON válido.', raw: content });
    }
    if (!schoolImprovementPlan && plan.sections && typeof plan.sections === 'object') {
      delete plan.sections['fl-plan1'];
      delete plan.sections['fl-plan2'];
    }

    const normalizedPlan = normalizeGeneratedPlan(plan, { dateFrom, dateTo, standards });

    res.json({
      ok: true,
      plan: normalizedPlan,
      meta: {
        model,
        standardsUsed:  standards.length,
        athenasLessons: subjMatches.length,
        athenasSource,             // 'live' | 'cache'
        hasFewshot:     !!example,
      },
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* ─────────── Athenas + baseapi live proxy ─────────────────────────────────
 *
 * The teacher's JWT lives in their browser's localStorage.auth.Token. We do
 * NOT store it server-side — every request from the SPA carries it in the
 * `x-athenas-token` header, and we forward it to the real APIs.
 *
 * Two upstreams (different header conventions, intentional per the doc):
 *   - baseapi.genialskillsweb.com   → "token: <jwt>"
 *   - athenasapi.genialskillsweb.com → "Authorization: Bearer <jwt>"
 *
 * If no token is provided, every endpoint returns { fromMock: true, ... }
 * so the frontend can render the same shape from local cache without branching.
 */
const ATHENAS_BASE   = 'https://athenasapi.genialskillsweb.com';
const BASEAPI_BASE   = 'https://baseapi.genialskillsweb.com';

function getAthenasToken(req) {
  return req.get('x-athenas-token') || req.body?.athenasToken || null;
}

app.post('/api/athenas/lessons/search', async (req, res) => {
  const token = getAthenasToken(req);
  if (!token) return res.json({ lessons: [], total: 0, fromMock: true, reason: 'no-token' });
  const {
    subjectCodes = [], levelCodes = [], standardCodes = [], expectationCodes = [],
    text = '', page = 0, limit = 12,
  } = req.body || {};
  try {
    const upstream = await fetch(`${BASEAPI_BASE}/teachersapi/lessons/advance`, {
      method: 'POST',
      headers: { 'token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        SubjectCodes:        subjectCodes,
        LevelCodes:          levelCodes,
        StandardCodes:       standardCodes,
        ExpectationCodes:    expectationCodes,
        PageNumber:          Number(page) || 0,
        ContentFilter:       '',
        Limit:               Number(limit) || 12,
        OrderByCreationDate: true,
        OrderByTitle:        null,
        TeacherInputText:    text || '',
      }),
    });
    if (!upstream.ok) {
      const txt = await upstream.text();
      return res.status(upstream.status).json({ error: `baseapi ${upstream.status}: ${txt.slice(0, 200)}`, fromMock: false });
    }
    const data = await upstream.json();
    res.json({
      lessons:  data?.LessonsDetails?.Lessons || [],
      total:    data?.LessonsDetails?.TotalResults || 0,
      fromMock: false,
    });
  } catch (e) {
    res.status(502).json({ error: String(e), fromMock: false });
  }
});

app.get('/api/athenas/lessons/:id', async (req, res) => {
  const token = getAthenasToken(req);
  if (!token) return res.status(401).json({ error: 'no-token' });
  try {
    const upstream = await fetch(`${ATHENAS_BASE}/api/lessons/${encodeURIComponent(req.params.id)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!upstream.ok) {
      const txt = await upstream.text();
      return res.status(upstream.status).json({ error: `athenasapi ${upstream.status}: ${txt.slice(0, 200)}` });
    }
    res.json(await upstream.json());
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

app.get('/api/athenas/subjects', async (req, res) => {
  const token = getAthenasToken(req);
  if (!token) return res.json({ subjects: [], fromMock: true });
  try {
    const upstream = await fetch(`${ATHENAS_BASE}/api/subjects`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `athenasapi ${upstream.status}`, fromMock: false });
    }
    const data = await upstream.json();
    res.json({ subjects: Array.isArray(data) ? data : [], fromMock: false });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

app.get('/api/athenas/grades', async (req, res) => {
  const token = getAthenasToken(req);
  if (!token) return res.json({ grades: [], fromMock: true });
  try {
    const upstream = await fetch(`${BASEAPI_BASE}/teachersapi/grades`, {
      headers: { 'token': token },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `baseapi ${upstream.status}`, fromMock: false });
    }
    const data = await upstream.json();
    res.json({ grades: Array.isArray(data) ? data : [], fromMock: false });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

/**
 * /api/generate-image — generates a single image via Replicate (FLUX-schnell).
 * Body: { prompt: "...", aspect_ratio?: "1:1"|"4:3"|"16:9", style?: "..." }
 * Returns: { url, took_ms, model }
 *
 * Replicate's `Prefer: wait` header makes this synchronous (we wait up to 60s).
 */
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

app.post('/api/generate-image', async (req, res) => {
  if (!REPLICATE_API_TOKEN) {
    return res.status(503).json({ error: 'REPLICATE_API_TOKEN not configured' });
  }
  const { prompt, aspect_ratio = '4:3', style = '' } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const finalPrompt = style ? `${prompt}, ${style}` : prompt;
  const t0 = Date.now();

  // Retry on 429 (rate-limited) with exponential backoff.
  // Replicate free tier: 6 req/min with burst 1 while under $5 credit.
  const MAX_ATTEMPTS = 5;
  let lastError = null;
  let attempt = 0;

  try {
    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      // FLUX 1.1 Pro — sharper, anatomically correct, much better proportions
      // than schnell. ~$0.04/img · 5-8s per image. Supports prompt_upsampling
      // which expands the prompt internally via an LLM for richer outputs.
      const upstream = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type':  'application/json',
          'Prefer':        'wait',
        },
        body: JSON.stringify({
          input: {
            prompt: finalPrompt.slice(0, 500),
            aspect_ratio,
            output_format: 'webp',
            output_quality: 90,
            safety_tolerance: 2,
            prompt_upsampling: true,
          },
        }),
      });

      if (upstream.status === 429) {
        // Parse reset hint when present, else use exponential backoff (3s, 6s, 12s, 24s).
        const retryAfterHdr = Number(upstream.headers.get('retry-after')) || 0;
        const data = await upstream.json().catch(() => ({}));
        const hintFromMsg = (data?.detail || '').match(/(\d+)\s*s/);
        const waitMs = (retryAfterHdr || Number(hintFromMsg?.[1]) || (3 * 2 ** (attempt - 1))) * 1000;
        lastError = data?.detail || 'Rate limited by Replicate';
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, Math.min(waitMs, 30_000)));
          continue;
        }
        return res.status(429).json({ error: lastError, attempts: attempt });
      }

      const data = await upstream.json();
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: data?.detail || data?.error || `Replicate ${upstream.status}` });
      }
      if (data.status === 'failed' || data.error) {
        return res.status(502).json({ error: data.error || 'Replicate prediction failed', detail: data.logs });
      }
      const url = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!url) return res.status(502).json({ error: 'No output URL returned', status: data.status });

      return res.json({
        url,
        took_ms: Date.now() - t0,
        model: 'black-forest-labs/flux-1.1-pro',
        prompt: finalPrompt,
        attempts: attempt,
      });
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/storage-health', async (_req, res) => {
  const configured = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
  const checks = {
    teacher_assignments: { ok: false, error: configured ? null : 'Supabase is not configured.' },
    teacher_documents: { ok: false, error: configured ? null : 'Supabase is not configured.' },
    teacher_plannings: { ok: false, error: configured ? null : 'Supabase is not configured.' },
  };

  if (configured) {
    for (const table of Object.keys(checks)) {
      try {
        await supabaseRequest(table, { query: '?select=id&limit=1' });
        checks[table] = { ok: true, error: null };
      } catch (e) {
        checks[table] = { ok: false, error: String(e.message || e) };
      }
    }
  }

  res.json({
    ok: configured && Object.values(checks).every(check => check.ok),
    configured,
    hasUrl: !!SUPABASE_URL,
    hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
    checks,
  });
});

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  env: {
    hasOpenRouter:      !!OPENROUTER_API_KEY,
    hasReplicate:       !!REPLICATE_API_TOKEN,
    hasSupabase:        !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
    hasSupabaseUrl:     !!SUPABASE_URL,
    hasSupabaseServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
    weeklyPlansBaseUrl: R2_BASE || '(local)',
  },
}));

// SPA fallback — all non-API GETs return the built index.html so client-side routes work.
app.get(/^\/(?!api\/|plans-files\/|icons\/|assets\/).*/, (_req, res, next) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (!fsSync.existsSync(indexPath)) return next();
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`Genial Skills Maestro running at http://localhost:${PORT}`);
});
