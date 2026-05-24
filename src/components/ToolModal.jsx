import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { MODELS } from "../data/toolsConfig.js";
import Ic from './Icons.jsx';
import StandardsPicker from './StandardsPicker.jsx';
import AthenasLessonPicker from './AthenasLessonPicker.jsx';
import { exportMarkdownPDF, exportPPTX, exportWorksheet } from './exporters.js';
import { saveGeneratedDocument, updateDocument } from '../services/documentStore.js';
/* Generic AI tool modal: form + streaming output + model selector + copy/regenerate. */

const ATHENAS_ASSISTANT_ACTIONS = [
  { value: 'profundizar', label: 'Preguntas para profundizar' },
  { value: 'practica', label: 'Items de practica' },
  { value: 'dok34', label: 'Ejercicios nivel 3 y 4' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'ppt', label: 'PowerPoint' },
];

/**
 * Format an Athenas lesson into a rich reference block that the LLM can use
 * as actual source material (not just a title). Includes the full standards
 * list and any concept definitions returned by the API.
 */
function formatLessonAsReference(lesson) {
  const lines = [];
  lines.push(`📘 LECCIÓN DE ATHENAS — ${lesson.title}`);
  const meta = [
    lesson.subjectCode && `Materia: ${lesson.subjectCode}`,
    lesson.levelCode   && `Grado: ${lesson.levelCode}`,
    lesson.lessonNo    && `Lección N°: ${lesson.lessonNo}`,
    lesson.blueprint   && '📐 Blueprint',
    lesson.isGapClosing && '🌉 Gap closing',
  ].filter(Boolean).join(' · ');
  if (meta) lines.push(meta);

  if (lesson.standards?.length) {
    lines.push('');
    lines.push('Estándares cubiertos:');
    lesson.standards.forEach(s => {
      lines.push(`  • ${s.Code}${s.Description ? ` — ${s.Description}` : ''}`);
    });
  }

  // Lesson body (HTML stripped) — the actual pedagogical text the teacher uses
  if (lesson.description) {
    const desc = stripDefinitionHtml(lesson.description);
    if (desc) {
      lines.push('');
      lines.push('Descripción / cuerpo de la lección:');
      lines.push(desc.length > 1500 ? desc.slice(0, 1500) + '…' : desc);
    }
  }

  if (lesson.objectives?.length) {
    lines.push('');
    lines.push(`Objetivos de aprendizaje (${lesson.objectives.length}):`);
    lesson.objectives.forEach(o => {
      const text = stripDefinitionHtml(o.Desc || o.Description || '');
      if (text) lines.push(`  • ${text}`);
    });
  }

  if (lesson.definitions?.length) {
    lines.push('');
    lines.push(`Conceptos / Definiciones (${lesson.definitions.length}):`);
    lesson.definitions.forEach(d => {
      // Athenas: Name = term, Desc = body (HTML, may contain <audio> + entities)
      const term = d.Name || d.DefinitionTitle || d.Term || d.Title || '';
      const body = stripDefinitionHtml(d.Desc || d.DefinitionText || d.Definition || d.Description || d.Body || '');
      if (term || body) lines.push(`  • ${term}${term && body ? ': ' : ''}${body}`.trim());
    });
  }

  if (lesson.examples?.length) {
    lines.push('');
    lines.push(`Ejemplos pedagógicos (${lesson.examples.length}):`);
    lesson.examples.forEach(e => {
      const name = e.Name || e.Title || '';
      const body = stripDefinitionHtml(e.Desc || e.Description || '');
      if (name || body) {
        const truncated = body.length > 280 ? body.slice(0, 280) + '…' : body;
        lines.push(`  • ${name}${name && truncated ? ': ' : ''}${truncated}`.trim());
      }
    });
  }

  if (lesson.performanceTasks?.length) {
    lines.push('');
    lines.push(`Tareas de desempeño sugeridas (${lesson.performanceTasks.length}):`);
    lesson.performanceTasks.forEach(t => {
      const text = stripDefinitionHtml(t.Desc || t.Description || t.Name || '');
      if (text) lines.push(`  • ${text}`);
    });
  }

  if (lesson.strategies?.length) {
    lines.push('');
    lines.push(`Estrategias de enseñanza (${lesson.strategies.length}):`);
    lesson.strategies.forEach(s => {
      const text = stripDefinitionHtml(s.Desc || s.Description || s.Name || '');
      if (text) lines.push(`  • ${text}`);
    });
  }

  if (lesson.themes?.length) {
    const themeText = lesson.themes.map(t => stripDefinitionHtml(t.Desc || t.Name || '')).filter(Boolean).join(', ');
    if (themeText) {
      lines.push('');
      lines.push(`Temas transversales: ${themeText}`);
    }
  }

  return lines.join('\n');
}

/**
 * Athenas returns definition bodies as HTML wrapped in <p> tags, often with
 * embedded <audio> elements pointing to /assets/audio-resources/.../foo.mp3.
 * For an LLM prompt we want plain readable text — strip tags, drop audio,
 * decode common entities, collapse whitespace.
 */
function stripDefinitionHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<audio[\s\S]*?<\/audio>/gi, '')              // drop audio players
    .replace(/<[^>]+>/g, ' ')                               // strip all other tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function buildAthenasAssistantPrompt(rawPrompt, action) {
  const prompt = String(rawPrompt || '').trim();
  const hasLesson = /LECCI|ATHENAS|Est[aÃ¡]ndares cubiertos|Conceptos \/ Definiciones/i.test(prompt);
  if (!hasLesson) return prompt;

  const instructions = {
    profundizar: `Analiza la leccion como fuente y responde con:
1. 3 ideas esenciales que la maestra debe asegurar.
2. 5-7 preguntas concretas para que la maestra escoja por donde profundizar.
3. 3 posibles mini-lecciones o demostraciones cortas basadas en la leccion.
No te quedes solamente en conceptos/definiciones.`,
    practica: `Usa la leccion como fuente y crea items de practica listos para estudiantes:
1. Instrucciones para el estudiante.
2. 10-12 items variados con dificultad progresiva.
3. Clave de respuestas.
4. Nota breve para la maestra sobre que destreza mide cada bloque.`,
    dok34: `Usa la leccion como fuente y crea ejercicios de nivel 3 y 4:
1. 4 tareas DOK 3 de razonamiento estrategico.
2. 2 tareas DOK 4 de pensamiento extendido/proyecto corto.
3. Criterios de exito para cada tarea.
4. Respuestas esperadas o evidencia de dominio.`,
    worksheet: `Convierte la leccion en un worksheet imprimible:
1. Titulo, nombre y fecha.
2. Activacion breve.
3. Practica guiada.
4. Practica independiente.
5. Reto DOK 3/4.
6. Clave de respuestas separada al final.
Deja espacio indicado para que el estudiante conteste.`,
    ppt: `Convierte la leccion en una presentacion PowerPoint editable:
Usa estructura markdown con # para titulo y ## para cada slide.
Incluye 8-10 slides con bullets breves, notas del maestro, actividad rapida y cierre.
Cuando aporte visualmente, sugiere tags [IMAGE: prompt en ingles].`,
  };

  return `La maestra selecciono una leccion de Athenas. No hagas solo un analisis general.

Accion solicitada: ${ATHENAS_ASSISTANT_ACTIONS.find(a => a.value === action)?.label || action}

${instructions[action] || instructions.profundizar}

Leccion fuente:
"""
${prompt}
"""`;
}

function FileUploadButton({ onText }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/extract-text', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      onText(j.text || '');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <span className="tm-upload">
      <button type="button"
        className="tm-upload-btn"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Subir PDF, DOCX o TXT"
      >
        {busy ? '⏳ Subiendo…' : '📎 Subir archivo'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      {error && <span className="tm-upload-err">{error}</span>}
    </span>
  );
}

// Render a single LaTeX snippet to HTML. Falls back to escaped raw text on parse errors
// (which happens often during streaming when the math isn't fully received yet).
function renderMath(tex, displayMode) {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false, strict: 'ignore' });
  } catch {
    const esc = tex.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return displayMode ? `<pre class="tm-math-err">${esc}</pre>` : `<code>${esc}</code>`;
  }
}

/**
 * Find every [IMAGE: prompt] tag in the markdown, generate images in parallel
 * via /api/generate-image (Replicate FLUX-schnell), and replace each tag with
 * the resulting ![alt](url) markdown. Updates the output as each finishes so
 * the user sees them appear incrementally.
 */
async function resolveImageTags(text, setOutput, setImageStatus) {
  const re = /\[IMAGE:\s*([^\]]+)\]/gi;
  const matches = [...text.matchAll(re)];
  if (!matches.length) return text;

  // Swap tags to loading placeholders so the user sees something immediately
  let working = text.replace(re, (_, p) => `[IMAGE_LOADING: ${p.trim()}]`);
  setOutput(working);
  setImageStatus(`Generando 0/${matches.length} imágenes…`);

  // Fire all images in parallel — Replicate's standard tier (>$5 credit) allows
  // many concurrent requests. Backend keeps retry-on-429 as a safety net in
  // case credit ever drops back to free tier or a brief spike happens.
  let done = 0;
  await Promise.all(matches.map(async (m) => {
    const prompt = m[1].trim();
    const placeholder = `[IMAGE_LOADING: ${prompt}]`;
    try {
      const r = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || `HTTP ${r.status}`);
      const altText = prompt.slice(0, 80).replace(/"/g, "'");
      working = working.replace(placeholder, `![${altText}](${j.url})`);
    } catch (e) {
      working = working.replace(placeholder, `*[⚠ Imagen no disponible: ${e.message || e}]*`);
    }
    done++;
    setOutput(working);
    setImageStatus(`Generando ${done}/${matches.length} imágenes…`);
  }));
  setImageStatus('');
  return working;
}

function mdToHtml(md) {
  if (!md) return '';

  // 1) Extract math blocks first so HTML-escape + markdown can't mangle them.
  //    Block first ($$...$$), then inline ($...$). Inline avoids matching currency
  //    by requiring the closing $ to be on the same line and the contents to start
  //    with a non-space character.
  const mathParts = [];
  const stash = (latex, displayMode) => {
    const idx = mathParts.length;
    mathParts.push({ latex, displayMode });
    return ` MATH${idx} `;
  };
  let work = md
    // $$...$$ block (greedy across lines)
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => stash(tex.trim(), true))
    // \[ ... \] LaTeX block style
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => stash(tex.trim(), true))
    // $...$ inline — must not start with whitespace or digit-only (avoids $5, $ price)
    .replace(/\$(?!\s)([^\n$]+?)(?<!\s)\$(?!\d)/g, (_, tex) => stash(tex, false))
    // \( ... \) LaTeX inline style
    .replace(/\\\(([^\n]+?)\\\)/g, (_, tex) => stash(tex, false));

  // very small markdown subset: headings, bold, italic, inline code, lists, tables, newlines
  let html = work
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // tables: blocks of lines containing pipes
  html = html.replace(/((?:^\|.*\|\s*\n?)+)/gm, (block) => {
    const rows = block.trim().split('\n');
    if (rows.length < 2) return block;
    const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const head = cells(rows[0]);
    const isSep = /^\s*[:|\-\s]+\s*$/.test(rows[1].replace(/\|/g,''));
    const bodyRows = (isSep ? rows.slice(2) : rows.slice(1)).map(cells);
    let out = '<table><thead><tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    bodyRows.forEach(r => { out += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>'; });
    out += '</tbody></table>';
    return out;
  });

  html = html
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?]|$)/g, '$1<em>$2</em>')
    // Markdown images: ![alt](url) — wrapped in an anchor so clicking opens
    // the original full-size image in a new tab (acts like a lightbox).
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="tm-md-img-link" title="Click para ver a tamaño completo"><img src="$2" alt="$1" class="tm-md-img" loading="lazy" /></a>')
    // Image placeholder during generation: [IMAGE_LOADING: prompt]
    .replace(/\[IMAGE_LOADING:\s*([^\]]+)\]/g, '<div class="tm-md-img-loading">🎨 Generando imagen: <em>$1</em></div>');

  // bullets
  html = html.replace(/(?:^|\n)((?:- .+\n?)+)/g, (m, list) => {
    const items = list.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `\n<ul>${items}</ul>`;
  });
  // numbered
  html = html.replace(/(?:^|\n)((?:\d+\.\s.+\n?)+)/g, (m, list) => {
    const items = list.trim().split('\n').map(l => `<li>${l.replace(/^\d+\.\s/, '')}</li>`).join('');
    return `\n<ol>${items}</ol>`;
  });

  // paragraphs (lines not already in a block)
  html = html.split(/\n{2,}/).map(p => {
    if (/^\s*<(h\d|ul|ol|table|pre)/.test(p)) return p;
    return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  // Re-insert KaTeX-rendered math at the placeholder positions
  html = html.replace(/\s?MATH(\d+)\s?/g, (_, n) => {
    const m = mathParts[Number(n)];
    if (!m) return '';
    const rendered = renderMath(m.latex, m.displayMode);
    return m.displayMode
      ? `<div class="tm-math-block">${rendered}</div>`
      : rendered;
  });

  return html;
}

function parseEditableSlides(markdown) {
  const lines = String(markdown || '').split('\n');
  const slides = [];
  let current = null;

  function flush() {
    if (!current) return;
    const rawBody = current.body.join('\n').trim();
    const image = rawBody.match(/!\[([^\]]*)\]\(([^)\s]+)\)/);
    const link = rawBody.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
    const notes = rawBody.match(/(?:^|\n)(?:Notas?|Notas del maestro):\s*([\s\S]+)/i);
    const body = rawBody
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1')
      .replace(/(?:^|\n)(?:Notas?|Notas del maestro):\s*[\s\S]+$/i, '')
      .trim();
    slides.push({
      ...current,
      body,
      imageAlt: image?.[1] || '',
      imageUrl: image?.[2] || '',
      linkText: link?.[1] || '',
      linkUrl: link?.[2] || '',
      notes: notes?.[1]?.trim() || '',
    });
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      flush();
      current = { title: heading[2].replace(/\*\*/g, '').trim(), body: [] };
      continue;
    }
    if (!current) current = { title: 'Contenido', body: [] };
    current.body.push(line);
  }
  flush();
  return slides.length ? slides : [{ title: 'Contenido', body: markdown || '' }];
}

function slidesToMarkdown(slides) {
  return slides.map((slide, index) => {
    const heading = index === 0 ? '#' : '##';
    const parts = [slide.body || ''];
    if (slide.imageUrl) parts.push(`![${slide.imageAlt || slide.title || 'Imagen'}](${slide.imageUrl})`);
    if (slide.linkUrl) parts.push(`[${slide.linkText || slide.linkUrl}](${slide.linkUrl})`);
    if (slide.notes) parts.push(`Notas del maestro: ${slide.notes}`);
    return `${heading} ${slide.title || 'Contenido'}\n\n${parts.filter(Boolean).join('\n\n')}`.trim();
  }).join('\n\n');
}

function SlideWorkspace({ value, onChange }) {
  const slides = React.useMemo(() => parseEditableSlides(value), [value]);
  const [active, setActive] = React.useState(0);
  const current = slides[Math.min(active, Math.max(slides.length - 1, 0))] || slides[0];

  React.useEffect(() => {
    if (active > slides.length - 1) setActive(Math.max(slides.length - 1, 0));
  }, [active, slides.length]);

  function updateSlide(index, patch) {
    const next = slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide));
    onChange(slidesToMarkdown(next));
  }

  function addSlide() {
    onChange(slidesToMarkdown([...slides, { title: 'Nueva diapositiva', body: '- Punto clave\n- Evidencia o actividad' }]));
    setActive(slides.length);
  }

  function removeSlide(index) {
    const next = slides.filter((_, i) => i !== index);
    onChange(slidesToMarkdown(next.length ? next : [{ title: 'Contenido', body: '' }]));
    setActive(Math.max(0, index - 1));
  }

  function duplicateSlide() {
    if (!current) return;
    const next = [...slides.slice(0, active + 1), { ...current, title: `${current.title || 'Slide'} copia` }, ...slides.slice(active + 1)];
    onChange(slidesToMarkdown(next));
    setActive(active + 1);
  }

  function appendBullet() {
    if (!current) return;
    const body = `${current.body || ''}\n- Nuevo punto`.trim();
    updateSlide(active, { body });
  }

  return (
    <div className="tm-slide-workspace">
      <div className="tm-slide-rail">
        {slides.map((slide, i) => (
          <button
            type="button"
            key={`${i}-${slide.title}`}
            className={`tm-slide-thumb ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
          >
            <span>{i + 1}</span>
            <strong>{slide.title || 'Sin titulo'}</strong>
          </button>
        ))}
        <button type="button" className="tm-work-add" onClick={addSlide}>+ Slide</button>
      </div>
      <div className="tm-slide-editor">
        {current && (
          <>
            <div className="tm-slide-toolbar" role="toolbar" aria-label="Herramientas de diapositiva">
              <button type="button" onClick={appendBullet}>+ Texto</button>
              <button type="button" onClick={() => updateSlide(active, { imageUrl: current.imageUrl || 'https://', imageAlt: current.imageAlt || current.title })}>+ Imagen</button>
              <button type="button" onClick={() => updateSlide(active, { linkUrl: current.linkUrl || 'https://', linkText: current.linkText || 'Recurso' })}>+ Enlace</button>
              <button type="button" onClick={duplicateSlide}>Duplicar</button>
              <button type="button" className="danger" onClick={() => removeSlide(active)}>Borrar</button>
            </div>

            <section className="tm-slide-stage" aria-label={`Slide ${active + 1}`}>
              <div className="tm-slide-canvas">
                <input
                  className="tm-slide-title-input"
                  value={current.title}
                  onChange={(e) => updateSlide(active, { title: e.target.value })}
                  placeholder="Titulo de la diapositiva"
                />
                <textarea
                  className="tm-slide-body-input"
                  value={current.body}
                  onChange={(e) => updateSlide(active, { body: e.target.value })}
                  placeholder="- Punto principal&#10;- Actividad o evidencia"
                />
                {current.imageUrl && (
                  <div className="tm-slide-image-box">
                    <img src={current.imageUrl} alt={current.imageAlt || ''} />
                  </div>
                )}
                {current.linkUrl && (
                  <a className="tm-slide-link-chip" href={current.linkUrl} target="_blank" rel="noopener noreferrer">
                    {current.linkText || current.linkUrl}
                  </a>
                )}
              </div>
            </section>

            <aside className="tm-slide-inspector">
              <label>
                <span>URL de imagen</span>
                <input value={current.imageUrl || ''} onChange={(e) => updateSlide(active, { imageUrl: e.target.value })} placeholder="https://..." />
              </label>
              <label>
                <span>Descripcion de imagen</span>
                <input value={current.imageAlt || ''} onChange={(e) => updateSlide(active, { imageAlt: e.target.value })} placeholder="Descripcion breve" />
              </label>
              <label>
                <span>Texto del enlace</span>
                <input value={current.linkText || ''} onChange={(e) => updateSlide(active, { linkText: e.target.value })} placeholder="Recurso, video, lectura..." />
              </label>
              <label>
                <span>URL del enlace</span>
                <input value={current.linkUrl || ''} onChange={(e) => updateSlide(active, { linkUrl: e.target.value })} placeholder="https://..." />
              </label>
              <label className="tm-slide-notes">
                <span>Notas del maestro</span>
                <textarea value={current.notes || ''} onChange={(e) => updateSlide(active, { notes: e.target.value })} placeholder="Notas para presentar esta diapositiva" />
              </label>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

function WorksheetWorkspace({ value, onChange, title }) {
  return (
    <div className="tm-worksheet-workspace">
      <div className="tm-paper-preview">
        <div className="tm-paper">
          <header>
            <strong>{title}</strong>
            <span>Nombre: ____________________ Fecha: __________</span>
          </header>
          <div
            className="tm-paper-body"
            dangerouslySetInnerHTML={{ __html: mdToHtml(value) }}
          />
        </div>
      </div>
      <label className="tm-work-editor">
        <span>Contenido editable de la hoja</span>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

function ToolModal({ tool, onClose, embedded = false }) {
  const [model, setModel] = React.useState(tool.defaultModel);
  const initial = React.useMemo(() => Object.fromEntries(tool.fields.map(f => [
    f.name,
    f.default ?? (f.type === 'standards' ? [] : ''),
  ])), [tool]);
  const [values, setValues] = React.useState(initial);
  const [output, setOutput] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | streaming | done | error
  const [error, setError]   = React.useState('');
  const [history, setHistory] = React.useState([]); // for chat-mode tools
  const [savedDoc, setSavedDoc]   = React.useState(null);
  const [imageStatus, setImageStatus] = React.useState(''); // '' | 'generating-3-of-5' | 'done'
  const [workspaceView, setWorkspaceView] = React.useState('preview');
  const [athenasAction, setAthenasAction] = React.useState('profundizar');
  const abortRef = React.useRef(null);
  const outRef = React.useRef(null);

  const isChat = tool.isChat;

  React.useEffect(() => {
    if (embedded) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [embedded, onClose]);

  React.useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [output]);

  React.useEffect(() => {
    if (!savedDoc || status !== 'done') return;
    const timer = setTimeout(() => {
      updateDocument(savedDoc.id, { content: output });
    }, 600);
    return () => clearTimeout(timer);
  }, [output, savedDoc, status]);

  const setField = (name, v) => setValues(s => ({ ...s, [name]: v }));

  const canSubmit = tool.fields.every(f => {
    if (f.type === 'standards') return true;        // standards picker is optional
    if (!f.required) return true;
    const v = values[f.name];
    if (Array.isArray(v)) return v.length > 0;
    return v && String(v).trim();
  });

  function buildSystemWithStandards() {
    let sys = tool.system || '';
    // Collect selected standards from any 'standards' field
    const standardsFields = tool.fields.filter(f => f.type === 'standards');
    const all = [];
    for (const f of standardsFields) {
      const sel = values[f.name];
      if (Array.isArray(sel) && sel.length) all.push(...sel);
    }
    if (all.length) {
      const block = all.map(s => `- **${s.code}** — ${s.expectation}`).join('\n');
      sys += `\n\n## Estándares DEPR en alcance\nEstas son las expectativas oficiales del Departamento de Educación de Puerto Rico que debes incorporar y citar (por su código) en tu respuesta:\n${block}`;
    }
    return sys;
  }

  // Optional: pull a few-shot example matching the current materia + grado
  async function fetchFewshotExample() {
    if (!tool.useFewshot) return null;
    const subj = values.materia;
    const gr   = values.grado;
    if (!subj || !gr) return null;
    try {
      const params = new URLSearchParams();
      params.set('subject', subj);
      // Try exact scope first, then any
      const r = await fetch(`/api/fewshot-plans?${params}`);
      const j = await r.json();
      if (!j.examples?.length) return null;
      // Prefer one whose scope contains the requested grade digit
      const gradeDigit = String(gr).match(/\d+|K/i)?.[0] || '';
      const best = j.examples.find(e => (e.scope || '').includes(gradeDigit)) || j.examples[0];
      return best;
    } catch { return null; }
  }

  async function generate(e) {
    e?.preventDefault?.();
    if (!canSubmit || status === 'streaming') return;
    setError('');
    setOutput('');
    setSavedDoc(null);
    setWorkspaceView('preview');
    setStatus('streaming');

    const rawUserPrompt = tool.buildPrompt(values);
    const userPrompt = isChat ? buildAthenasAssistantPrompt(rawUserPrompt, athenasAction) : rawUserPrompt;
    let systemPrompt = buildSystemWithStandards();

    // Inject a real DEPR plan as a few-shot example when the tool opts in
    const example = await fetchFewshotExample();
    if (example) {
      systemPrompt += `\n\n## Ejemplo de plan DEPR del distrito (${example.subject} · grado ${example.scope}, Unidad ${example.unit}${example.week ? `, Semana ${example.week}` : ''})\nUsa este ejemplo como referencia de formato, profundidad y estilo — no lo copies literalmente, créalo nuevo adaptado al tema solicitado:\n\n"""\n${example.text}\n"""`;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, system: systemPrompt, user: userPrompt }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${txt}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
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
          if (payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            if (j.error) {
              setStatus('error');
              setError(j.error);
              ctrl.abort();
              return;
            }
            if (j.delta) { acc += j.delta; setOutput(acc); }
          } catch { /* ignore non-json keep-alives */ }
        }
      }
      setStatus('done');

      // ─── Post-process [IMAGE: prompt] tags into real generated images ───
      acc = await resolveImageTags(acc, setOutput, setImageStatus);

      setSavedDoc(saveGeneratedDocument({
        title: tool.title,
        toolTitle: tool.title,
        category: tool.category,
        model,
        content: acc,
        prompt: userPrompt,
        values,
        kind: tool.outputKind || 'markdown',
      }));
      if (isChat) setHistory(h => [...h, { q: userPrompt, a: acc, model }]);
    } catch (err) {
      if (err.name === 'AbortError') { setStatus('idle'); return; }
      setStatus('error');
      setError(err.message || String(err));
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setStatus('idle');
  }

  function copyOut() {
    navigator.clipboard.writeText(output).then(() => {
      const el = document.querySelector('.tm-copy');
      if (el) { el.classList.add('ok'); setTimeout(() => el.classList.remove('ok'), 1200); }
    });
  }

  function downloadOut() {
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${tool.title.replace(/\s+/g,'_')}.md`;
    a.click(); URL.revokeObjectURL(url);
  }

  const safeTitle = tool.title.replace(/\s+/g, '_');
  const [exporting, setExporting] = React.useState('');
  const [interactiveError, setInteractiveError] = React.useState('');
  const chatHasAthenasLesson = isChat && /LECCI|ATHENAS|Est[aÃ¡]ndares cubiertos|Conceptos \/ Definiciones/i.test(String(values.pregunta || ''));
  const canMakeInteractive = tool.title === 'Examen de Matemáticas';

  async function handleExportPDF() {
    setExporting('pdf');
    try { exportMarkdownPDF(output, `${safeTitle}.pdf`, tool.title); }
    finally { setExporting(''); }
  }
  async function handleExportPPTX() {
    setExporting('pptx');
    try { await exportPPTX(output, `${safeTitle}.pptx`, tool.title); }
    finally { setExporting(''); }
  }
  function handleExportWorksheet() {
    setExporting('worksheet');
    try { exportWorksheet(output, `${safeTitle}_worksheet.pdf`, tool.title); }
    finally { setExporting(''); }
  }

  async function handleMakeInteractive() {
    setExporting('interactive');
    setInteractiveError('');
    try {
      const res = await fetch('/api/interactive-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tool.title,
          subject: 'Matemáticas',
          grade: values.grado,
          sourceTool: tool.title,
          markdown: output,
          values,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      window.location.assign(json.teacherUrl);
    } catch (e) {
      setInteractiveError(e.message || String(e));
    } finally {
      setExporting('');
    }
  }

  return (
    <div
      className={embedded ? 'tm-workspace-shell' : 'tm-backdrop'}
      onMouseDown={(e) => { if (!embedded && e.target === e.currentTarget) onClose(); }}
    >
      <div className={`tm-modal ${embedded ? 'embedded' : ''}`} role={embedded ? 'region' : 'dialog'} aria-label={tool.title}>
        <header className="tm-head">
          <div>
            <div className="tm-eyebrow"><Ic.sparkle /> Herramienta IA</div>
            <h2>{tool.title}</h2>
            <p>{tool.subtitle}</p>
          </div>
          <button className={embedded ? 'tm-back' : 'tm-close'} onClick={onClose} aria-label={embedded ? 'Volver a herramientas' : 'Cerrar'}>
            {embedded ? 'Volver' : '×'}
          </button>
        </header>

        <div className="tm-body">
          <form className="tm-form" onSubmit={generate}>
            <label className="tm-field">
              <span>Modelo</span>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>

            {isChat && (
              <label className="tm-field tm-athenas-action">
                <span>Cuando uses una leccion de Athenas</span>
                <select value={athenasAction} onChange={(e) => setAthenasAction(e.target.value)}>
                  {ATHENAS_ASSISTANT_ACTIONS.map(action => (
                    <option key={action.value} value={action.value}>{action.label}</option>
                  ))}
                </select>
                <small>Elige la leccion con el boton de Athenas y luego selecciona el producto que quieres crear.</small>
              </label>
            )}

            {tool.fields.map(f => {
              if (f.type === 'standards') {
                const subj = f.subjectField ? values[f.subjectField] : f.subject;
                const gr   = f.gradeField   ? values[f.gradeField]   : f.grade;
                return (
                  <div key={f.name} className="tm-field">
                    <StandardsPicker
                      subject={subj}
                      grade={gr}
                      value={Array.isArray(values[f.name]) ? values[f.name] : []}
                      onChange={(arr) => setField(f.name, arr)}
                    />
                  </div>
                );
              }
              return (
                <label key={f.name} className="tm-field">
                  <span className="tm-field-row">
                    <span>{f.label}{f.required ? ' *' : ''}</span>
                    {f.type === 'textarea' && (
                      <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                        <FileUploadButton onText={(t) => setField(f.name, t)} />
                        <AthenasLessonPicker
                          subject={values.materia}
                          grade={values.grado}
                          onPick={(lesson) => {
                            setField(f.name, formatLessonAsReference(lesson));
                          }}
                        />
                      </span>
                    )}
                  </span>
                  {f.type === 'textarea' ? (
                    <textarea
                      rows={f.rows || 4}
                      placeholder={f.placeholder}
                      value={values[f.name]}
                      onChange={(e) => setField(f.name, e.target.value)}
                    />
                  ) : f.type === 'select' ? (
                    <select value={values[f.name]} onChange={(e) => setField(f.name, e.target.value)}>
                      <option value="">— elegir —</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type || 'text'}
                      placeholder={f.placeholder}
                      value={values[f.name]}
                      onChange={(e) => setField(f.name, e.target.value)}
                    />
                  )}
                </label>
              );
            })}

            {status === 'streaming' ? (
              <button type="button" className="tm-btn danger" onClick={cancel}>Cancelar</button>
            ) : (
              <button type="submit" className="tm-btn primary" disabled={!canSubmit}>
                <Ic.sparkle /> {isChat ? (chatHasAthenasLesson ? 'Crear con Athenas' : 'Preguntar') : 'Generar'} <Ic.arrow />
              </button>
            )}
          </form>

          <div className="tm-output">
            <div className="tm-out-head">
              <div className="tm-out-title">
                {status === 'streaming' && <span className="tm-spinner" />}
                {status === 'idle'      && <span className="tm-dim">Resultado aparecerá aquí…</span>}
                {status === 'streaming' && <span>Generando…</span>}
                {status === 'done'      && <span>{savedDoc ? 'Resultado guardado en Mis documentos' : 'Resultado'}</span>}
                {status === 'error'     && <span style={{color:'#b3261e'}}>Error</span>}
                {imageStatus           && <span className="tm-img-status">🎨 {imageStatus}</span>}
              </div>
              {output && status !== 'streaming' && (
                <div className="tm-out-actions">
                  <button className="tm-copy" onClick={copyOut} title="Copiar al portapapeles">📋 Copiar</button>
                  <button onClick={handleExportPDF} disabled={!!exporting} title="Descargar como PDF">
                    {exporting === 'pdf' ? '⏳' : '📄'} PDF
                  </button>
                  <button onClick={handleExportPPTX} disabled={!!exporting} title="Descargar como PowerPoint">
                    {exporting === 'pptx' ? '⏳' : '📊'} PPTX
                  </button>
                  <button onClick={handleExportWorksheet} disabled={!!exporting} title="Descargar como hoja de trabajo (con espacio para respuestas)">
                    {exporting === 'worksheet' ? '⏳' : '📝'} Worksheet
                  </button>
                  {canMakeInteractive && (
                    <button onClick={handleMakeInteractive} disabled={!!exporting} title="Crear sesión con QR para estudiantes">
                      {exporting === 'interactive' ? '⏳' : '▦'} Interactivo
                    </button>
                  )}
                  <button onClick={downloadOut} title="Descargar markdown crudo">.md</button>
                  <button onClick={generate} title="Regenerar">↻ Regenerar</button>
                </div>
              )}
            </div>
            {interactiveError && <div className="tm-inline-error">{interactiveError}</div>}

            {error ? (
              <pre className="tm-error">{error}</pre>
            ) : (
              <>
                {output && status !== 'streaming' && (
                  <div className="tm-work-tabs" role="tablist" aria-label="Vista del resultado">
                    <button type="button" className={workspaceView === 'preview' ? 'active' : ''} onClick={() => setWorkspaceView('preview')}>Vista</button>
                    <button type="button" className={workspaceView === 'edit' ? 'active' : ''} onClick={() => setWorkspaceView('edit')}>Editar texto</button>
                    <button type="button" className={workspaceView === 'slides' ? 'active' : ''} onClick={() => setWorkspaceView('slides')}>Editor PPT</button>
                    <button type="button" className={workspaceView === 'worksheet' ? 'active' : ''} onClick={() => setWorkspaceView('worksheet')}>Worksheet</button>
                  </div>
                )}

                {workspaceView === 'edit' && output ? (
                  <textarea
                    className="tm-editor"
                    value={output}
                    onChange={(e) => setOutput(e.target.value)}
                    spellCheck
                  />
                ) : workspaceView === 'slides' && output ? (
                  <SlideWorkspace value={output} onChange={setOutput} />
                ) : workspaceView === 'worksheet' && output ? (
                  <WorksheetWorkspace value={output} onChange={setOutput} title={tool.title} />
                ) : (
                  <div ref={outRef} className="tm-md" dangerouslySetInnerHTML={{ __html: mdToHtml(output) }} />
                )}
              </>
            )}

            {isChat && history.length > 0 && status === 'done' && (
              <div className="tm-chat-history">
                <details><summary>Historial ({history.length})</summary>
                  {history.slice(0,-1).reverse().map((h, i) => (
                    <div key={i} className="tm-chat-item">
                      <div className="tm-chat-q">{h.q}</div>
                      <div className="tm-md" dangerouslySetInnerHTML={{ __html: mdToHtml(h.a) }} />
                    </div>
                  ))}
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToolModal;
