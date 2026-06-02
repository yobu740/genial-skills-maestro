import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
// MODELS dropdown was removed by request — default is hardcoded to gpt-4o-mini below.
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

  if (lesson.fullText) {
    const fullText = stripDefinitionHtml(lesson.fullText);
    if (fullText) {
      lines.push('');
      lines.push('CONTENIDO COMPLETO REAL DE ATHENAS:');
      lines.push(fullText);
    }
  }

  // Lesson body (HTML stripped) — the actual pedagogical text the teacher uses
  if (lesson.description) {
    const desc = stripDefinitionHtml(lesson.description);
    if (desc) {
      lines.push('');
      lines.push('Descripción / cuerpo de la lección:');
      lines.push(desc);
    }
  }

  if (lesson.concept) {
    const concept = stripDefinitionHtml(lesson.concept);
    if (concept) {
      lines.push('');
      lines.push('Concepto central:');
      lines.push(concept);
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
        lines.push(`  • ${name}${name && body ? ': ' : ''}${body}`.trim());
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
function decodeHtmlEntities(value = '') {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    bull: '\u2022', iquest: '\u00bf', iexcl: '\u00a1', ndash: '-', mdash: '-',
    aacute: '\u00e1', eacute: '\u00e9', iacute: '\u00ed', oacute: '\u00f3', uacute: '\u00fa',
    Aacute: '\u00c1', Eacute: '\u00c9', Iacute: '\u00cd', Oacute: '\u00d3', Uacute: '\u00da',
    ntilde: '\u00f1', Ntilde: '\u00d1', uuml: '\u00fc', Uuml: '\u00dc',
    ldquo: '"', rdquo: '"', lsquo: "'", rsquo: "'",
  };
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const isHex = entity[1]?.toLowerCase() === 'x';
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return Object.prototype.hasOwnProperty.call(named, entity) ? named[entity] : match;
  });
}

function stripDefinitionHtml(html) {
  if (!html) return '';
  return decodeHtmlEntities(String(html)
    .replace(/<audio[\s\S]*?<\/audio>/gi, '')              // drop audio players
    .replace(/<[^>]+>/g, ' ')                               // strip all other tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&'))
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
Para cada slide incluye metadatos: <!-- type: hook|objective|concept|example|comparison|process|activity|recap|exit -->, <!-- claim: idea central --> y <!-- visual: intencion visual -->.
Varia los tipos de slide para que la presentacion tenga ritmo visual.
Cuando aporte visualmente, sugiere tags [IMAGE: prompt en ingles].`,
  };

  return `La maestra selecciono una leccion de Athenas. No hagas solo un analisis general.
Usa el bloque "CONTENIDO COMPLETO REAL DE ATHENAS" como fuente principal. No inventes actividades, conceptos, ejemplos, datos ni respuestas que no esten apoyados por esa fuente.
Si falta algun dato en la leccion, dilo como "no aparece en la fuente" en vez de completarlo por imaginacion.

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
  md = stripEditorMetadata(md);

  // 1) Extract math blocks first so HTML-escape + markdown can't mangle them.
  //    Block first ($$...$$), then inline ($...$). Inline avoids matching currency
  //    by requiring the closing $ to be on the same line and the contents to start
  //    with a non-space character.
  const mathParts = [];
  const stash = (latex, displayMode) => {
    const idx = mathParts.length;
    mathParts.push({ latex, displayMode });
    return `__GSM_MATH_${idx}__`;
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
  html = html.replace(/__GSM_MATH_(\d+)__/g, (_, n) => {
    const m = mathParts[Number(n)];
    if (!m) return '';
    const rendered = renderMath(m.latex, m.displayMode);
    return m.displayMode
      ? `<div class="tm-math-block">${rendered}</div>`
      : rendered;
  });

  return html;
}

function stripEditorMetadata(text = '') {
  return String(text)
    .replace(/<!--\s*(?:layout|style):\s*[\s\S]*?-->/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
    const alignMatch = rawBody.match(/<!-- align:\s*(left|center|right|justify)\s*-->/i);
    const layoutMatch = rawBody.match(/<!-- layout:\s*([\s\S]*?)\s*-->/i);
    const styleMatch = rawBody.match(/<!-- style:\s*([\s\S]*?)\s*-->/i);
    const typeMatch = rawBody.match(/<!-- type:\s*([a-z-]+)\s*-->/i);
    const claimMatch = rawBody.match(/<!-- claim:\s*([\s\S]*?)\s*-->/i);
    const visualMatch = rawBody.match(/<!-- visual:\s*([\s\S]*?)\s*-->/i);
    const notes = rawBody.match(/(?:^|\n)(?:Notas?|Notas del maestro):\s*([\s\S]+)/i);
    const body = rawBody
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1')
      .replace(/<!-- align:\s*(left|center|right|justify)\s*-->/gi, '')
      .replace(/<!-- layout:\s*[\s\S]*?\s*-->/gi, '')
      .replace(/<!-- style:\s*[\s\S]*?\s*-->/gi, '')
      .replace(/<!-- type:\s*[a-z-]+\s*-->/gi, '')
      .replace(/<!-- claim:\s*[\s\S]*?\s*-->/gi, '')
      .replace(/<!-- visual:\s*[\s\S]*?\s*-->/gi, '')
      .replace(/(?:^|\n)(?:Notas?|Notas del maestro):\s*[\s\S]+$/i, '')
      .trim();
    slides.push({
      ...current,
      body,
      imageAlt: image?.[1] || '',
      imageUrl: image?.[2] || '',
      linkText: link?.[1] || '',
      linkUrl: link?.[2] || '',
      align: alignMatch?.[1] || 'left',
      layout: parseSlideLayout(layoutMatch?.[1]),
      style: parseSlideStyle(styleMatch?.[1]),
      type: normalizeSlideType(typeMatch?.[1], slides.length),
      claim: claimMatch?.[1]?.trim() || '',
      visualIntent: visualMatch?.[1]?.trim() || '',
      notes: notes?.[1]?.trim() || '',
    });
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      flush();
      current = { title: stripSlideLabels(heading[2]).replace(/\*\*/g, '').trim(), body: [] };
      continue;
    }
    if (!current) current = { title: 'Contenido', body: [] };
    current.body.push(line);
  }
  flush();
  return slides.length ? slides : [{ title: 'Contenido', body: markdown || '', align: 'left', layout: defaultSlideLayout(), style: defaultSlideStyle() }];
}

function stripSlideLabels(text = '') {
  return String(text).replace(/^\s*(?:diapositiva|dispositiva|slide)\s*\d+\s*[:.)-]?\s*/i, '');
}

function slidesToMarkdown(slides) {
  return slides.map((slide, index) => {
    const heading = index === 0 ? '#' : '##';
    const parts = [slide.body || ''];
    if (slide.imageUrl) parts.push(`![${slide.imageAlt || slide.title || 'Imagen'}](${slide.imageUrl})`);
    if (slide.linkUrl) parts.push(`[${slide.linkText || slide.linkUrl}](${slide.linkUrl})`);
    if (slide.type) parts.push(`<!-- type: ${normalizeSlideType(slide.type, index)} -->`);
    if (slide.claim) parts.push(`<!-- claim: ${slide.claim} -->`);
    if (slide.visualIntent) parts.push(`<!-- visual: ${slide.visualIntent} -->`);
    if (slide.align && slide.align !== 'left') parts.push(`<!-- align: ${slide.align} -->`);
    if (slide.layout) parts.push(`<!-- layout: ${JSON.stringify(normalizeSlideLayout(slide.layout))} -->`);
    if (slide.style) parts.push(`<!-- style: ${JSON.stringify(normalizeSlideStyle(slide.style))} -->`);
    if (slide.notes) parts.push(`Notas del maestro: ${slide.notes}`);
    return `${heading} ${slide.title || 'Contenido'}\n\n${parts.filter(Boolean).join('\n\n')}`.trim();
  }).join('\n\n');
}

const SLIDE_CANVAS = { w: 1280, h: 720 };
const DEFAULT_SLIDE_LAYOUT = {
  title: { x: 86, y: 66, w: 1110, h: 92 },
  body: { x: 100, y: 178, w: 1080, h: 438 },
  image: { x: 824, y: 278, w: 320, h: 230 },
};
const FONT_OPTIONS = ['Poppins', 'Sora', 'Overlock', 'Georgia', 'Verdana'];
const DEFAULT_SLIDE_STYLE = { fontFace: 'Poppins', bodySize: 18, titleSize: 30 };
const SLIDE_TYPE_OPTIONS = [
  { value: 'hook', label: 'Activar' },
  { value: 'objective', label: 'Objetivo' },
  { value: 'concept', label: 'Concepto' },
  { value: 'example', label: 'Ejemplo' },
  { value: 'comparison', label: 'Comparar' },
  { value: 'process', label: 'Proceso' },
  { value: 'activity', label: 'Actividad' },
  { value: 'recap', label: 'Repaso' },
  { value: 'exit', label: 'Cierre' },
];

function parseSlideLayout(raw) {
  if (!raw) return defaultSlideLayout();
  try {
    return normalizeSlideLayout(JSON.parse(raw));
  } catch {
    return defaultSlideLayout();
  }
}

function defaultSlideLayout() {
  return normalizeSlideLayout(DEFAULT_SLIDE_LAYOUT);
}

function parseSlideStyle(raw) {
  if (!raw) return defaultSlideStyle();
  try {
    return normalizeSlideStyle(JSON.parse(raw));
  } catch {
    return defaultSlideStyle();
  }
}

function defaultSlideStyle() {
  return normalizeSlideStyle(DEFAULT_SLIDE_STYLE);
}

function normalizeSlideType(type, index = 0) {
  const raw = String(type || '').trim().toLowerCase();
  if (raw === 'closing' || raw === 'exit-ticket') return 'exit';
  if (SLIDE_TYPE_OPTIONS.some(option => option.value === raw)) return raw;
  return index === 0 ? 'hook' : 'concept';
}

function normalizeSlideStyle(style = {}) {
  const bodySize = clampNumber(style?.bodySize, 13, 26, DEFAULT_SLIDE_STYLE.bodySize);
  const titleSize = clampNumber(style?.titleSize, 20, 42, Math.max(bodySize + 10, DEFAULT_SLIDE_STYLE.titleSize));
  const fontFace = FONT_OPTIONS.includes(style?.fontFace) ? style.fontFace : DEFAULT_SLIDE_STYLE.fontFace;
  return { fontFace, bodySize, titleSize };
}

function normalizeSlideLayout(layout = {}) {
  return {
    title: normalizeBox(layout?.title, DEFAULT_SLIDE_LAYOUT.title),
    body: normalizeBox(layout?.body, DEFAULT_SLIDE_LAYOUT.body),
    image: normalizeBox(layout?.image, DEFAULT_SLIDE_LAYOUT.image),
  };
}

function normalizeBox(box, fallback) {
  const value = { ...fallback, ...(box || {}) };
  return {
    x: clampNumber(value.x, 0, SLIDE_CANVAS.w - 80, fallback.x),
    y: clampNumber(value.y, 0, SLIDE_CANVAS.h - 60, fallback.y),
    w: clampNumber(value.w, 120, SLIDE_CANVAS.w, fallback.w),
    h: clampNumber(value.h, 42, SLIDE_CANVAS.h, fallback.h),
  };
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseInlineFormatting(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function markdownToHtmlForEditor(md) {
  if (!md) return '<div><br></div>';
  const lines = md.split('\n');
  let inList = false;
  const html = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      const content = parseInlineFormatting(trimmed.substring(2));
      html.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      if (trimmed === '') {
        html.push('<div><br></div>');
      } else {
        const content = parseInlineFormatting(line);
        html.push(`<div>${content}</div>`);
      }
    }
  }
  if (inList) {
    html.push('</ul>');
  }
  return html.join('');
}

function htmlToMarkdown(html) {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  function clean(node) {
    let text = '';
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      
      if (tag === 'li') {
        let childText = '';
        for (const child of node.childNodes) {
          childText += clean(child);
        }
        return `- ${childText.trim()}\n`;
      }
      
      if (tag === 'strong' || tag === 'b') {
        let childText = '';
        for (const child of node.childNodes) {
          childText += clean(child);
        }
        return `**${childText}**`;
      }
      
      if (tag === 'em' || tag === 'i') {
        let childText = '';
        for (const child of node.childNodes) {
          childText += clean(child);
        }
        return `*${childText}*`;
      }

      if (tag === 'br') {
        return '\n';
      }
      if (tag === 'div' || tag === 'p') {
        let childText = '';
        for (const child of node.childNodes) {
          childText += clean(child);
        }
        return childText.endsWith('\n') ? childText : childText + '\n';
      }

      let childText = '';
      for (const child of node.childNodes) {
        childText += clean(child);
      }
      return childText;
    }
    return '';
  }

  const result = clean(temp);
  return result
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanGeneratedOutput(text = '') {
  return stripEditorMetadata(String(text).replace(
    /^(\s*(?:#{1,6}\s*|[-*]\s+|\d+[.)]\s+)?)\s*(?:diapositiva|dispositiva|slide)\s*\d+\s*[:.)-]?\s*/gim,
    (_, prefix = '') => prefix
  ).replace(/^\s*:\s*(?:K|Pre-K|Kinder|[1-9](?:ro|do|to|mo)?|1[0-2](?:mo)?)\s*$/gim, ''));
}

function SlideBodyEditor({ html, onChange, align, slideIndex, style }) {
  const editorRef = React.useRef(null);

  React.useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }
  }, [slideIndex]);

  const onInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      className="tm-slide-body-input rich-editor"
      style={{
        textAlign: align,
        outline: 'none',
        fontFamily: `${style.fontFace}, system-ui, sans-serif`,
        fontSize: `${style.bodySize}px`,
      }}
      onInput={onInput}
      placeholder="Haz clic aquí para añadir texto o viñetas..."
    />
  );
}

function MovableSlideBox({ box, className = '', label, onMove, children }) {
  const safeBox = normalizeBox(box, DEFAULT_SLIDE_LAYOUT.body);

  function beginDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.currentTarget.closest('.tm-slide-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / SLIDE_CANVAS.w;
    const start = { x: e.clientX, y: e.clientY, box: safeBox };

    const onPointerMove = (moveEvent) => {
      const next = normalizeBox({
        ...start.box,
        x: start.box.x + (moveEvent.clientX - start.x) / scale,
        y: start.box.y + (moveEvent.clientY - start.y) / scale,
      }, start.box);
      onMove(next);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  }

  return (
    <div
      className={`tm-slide-textbox ${className}`}
      style={{
        left: `${(safeBox.x / SLIDE_CANVAS.w) * 100}%`,
        top: `${(safeBox.y / SLIDE_CANVAS.h) * 100}%`,
        width: `${(safeBox.w / SLIDE_CANVAS.w) * 100}%`,
        height: `${(safeBox.h / SLIDE_CANVAS.h) * 100}%`,
      }}
    >
      <button type="button" className="tm-slide-drag-handle" onPointerDown={beginDrag} title={`Mover ${label}`}>
        {label}
      </button>
      {children}
    </div>
  );
}

// Real fullscreen presentation overlay — arrow-key navigation, ESC to exit,
// auto-fits to viewport. Reads styling from each slide's own style/layout.
function PresentationMode({ slides, startAt = 0, onExit }) {
  const [idx, setIdx] = React.useState(Math.min(startAt, Math.max(slides.length - 1, 0)));
  const current = slides[Math.min(idx, slides.length - 1)] || slides[0];
  const total = slides.length;

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onExit();
      else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') {
        setIdx(i => Math.min(i + 1, total - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        setIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Home') setIdx(0);
      else if (e.key === 'End') setIdx(total - 1);
    };
    window.addEventListener('keydown', onKey);
    document.documentElement.requestFullscreen?.().catch(() => {});
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [total, onExit]);

  const style = normalizeSlideStyle(current?.style || defaultSlideStyle());
  const bodyHtml = mdToHtml(current?.body || '');
  const fontFamily = `${style.fontFace}, system-ui, sans-serif`;
  const align = current?.align || 'left';

  return (
    <div className="tm-present-overlay" role="dialog" aria-modal="true" aria-label="Presentación">
      <div className="tm-present-stage" key={idx}>
        <article className="tm-present-slide" style={{ textAlign: align, fontFamily }}>
          {current?.title && (
            <h1 className="tm-present-title" style={{ fontSize: `clamp(40px, ${Math.max(style.titleSize * 2.6, 48)}px, 96px)` }}>
              {current.title}
            </h1>
          )}
          {current?.imageUrl && (
            <div className="tm-present-image-wrap">
              <img src={current.imageUrl} alt={current.imageAlt || ''} />
            </div>
          )}
          {bodyHtml && (
            <div
              className="tm-present-body tm-md"
              style={{ fontSize: `clamp(20px, ${Math.max(style.bodySize * 1.9, 24)}px, 36px)` }}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          )}
          {current?.linkUrl && (
            <a className="tm-present-link" href={current.linkUrl} target="_blank" rel="noopener noreferrer">
              🔗 {current.linkText || current.linkUrl}
            </a>
          )}
        </article>
      </div>

      <button className="tm-present-nav prev" onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0} aria-label="Anterior">‹</button>
      <button className="tm-present-nav next" onClick={() => setIdx(i => Math.min(i + 1, total - 1))} disabled={idx === total - 1} aria-label="Siguiente">›</button>

      <div className="tm-present-chrome">
        <span className="tm-present-counter">
          <strong>{String(idx + 1).padStart(2, '0')}</strong>
          <span>/ {String(total).padStart(2, '0')}</span>
        </span>
        <div className="tm-present-dots" aria-hidden="true">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`dot ${i === idx ? 'on' : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`Ir a diapositiva ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <button className="tm-present-exit" onClick={onExit} title="Salir (ESC)" aria-label="Salir">✕</button>
      <div className="tm-present-hint" aria-hidden="true">ESC — salir &nbsp;·&nbsp; ← → — navegar</div>
    </div>
  );
}

function SlideWorkspace({ value, onChange }) {
  const slides = React.useMemo(() => parseEditableSlides(value), [value]);
  const [active, setActive] = React.useState(0);
  const current = slides[Math.min(active, Math.max(slides.length - 1, 0))] || slides[0];

  const [showImagePicker, setShowImagePicker] = React.useState(false);
  const [aiImagePrompt, setAiImagePrompt] = React.useState('');
  const [generatingImage, setGeneratingImage] = React.useState(false);
  const [customImageUrl, setCustomImageUrl] = React.useState('');
  const [imageError, setImageError] = React.useState('');

  const [showInspector, setShowInspector] = React.useState(false);
  const [showNotes, setShowNotes] = React.useState(true);
  const [showIntent, setShowIntent] = React.useState(true);
  const [presenting, setPresenting] = React.useState(false);

  React.useEffect(() => {
    if (active > slides.length - 1) setActive(Math.max(slides.length - 1, 0));
  }, [active, slides.length]);

  function updateSlide(index, patch) {
    const next = slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide));
    onChange(slidesToMarkdown(next));
  }

  function updateLayoutPart(part, box) {
    const layout = normalizeSlideLayout(current?.layout || defaultSlideLayout());
    updateSlide(active, { layout: { ...layout, [part]: normalizeBox(box, layout[part]) } });
  }

  function updateSlideStyle(patch) {
    const style = normalizeSlideStyle(current?.style || defaultSlideStyle());
    updateSlide(active, { style: normalizeSlideStyle({ ...style, ...patch }) });
  }

  function beginImageDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.currentTarget.closest('.tm-slide-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / SLIDE_CANVAS.w;
    const start = { x: e.clientX, y: e.clientY, box: currentLayout.image };

    const move = (event) => {
      updateLayoutPart('image', {
        ...start.box,
        x: start.box.x + (event.clientX - start.x) / scale,
        y: start.box.y + (event.clientY - start.y) / scale,
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function addSlide() {
    onChange(slidesToMarkdown([...slides, { title: 'Nueva diapositiva', body: '- Punto clave\n- Evidencia o actividad', type: 'concept', claim: 'Idea principal que debe quedar clara.', visualIntent: 'Representacion visual simple del concepto.', align: 'left', layout: defaultSlideLayout(), style: defaultSlideStyle() }]));
    setActive(slides.length);
  }

  function removeSlide(index) {
    const next = slides.filter((_, i) => i !== index);
    onChange(slidesToMarkdown(next.length ? next : [{ title: 'Contenido', body: '', type: 'concept', align: 'left', layout: defaultSlideLayout(), style: defaultSlideStyle() }]));
    setActive(Math.max(0, index - 1));
  }

  function duplicateSlide() {
    if (!current) return;
    const next = [...slides.slice(0, active + 1), { ...current, title: `${current.title || 'Slide'} copia` }, ...slides.slice(active + 1)];
    onChange(slidesToMarkdown(next));
    setActive(active + 1);
  }

  function handleLocalImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateSlide(active, { imageUrl: event.target.result, imageAlt: file.name });
        setShowImagePicker(false);
      }
    };
    reader.onerror = () => {
      setImageError('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerateAIImage() {
    if (!aiImagePrompt.trim() || !current) return;
    setGeneratingImage(true);
    setImageError('');
    try {
      const enhancedPrompt = `${aiImagePrompt}, children's book illustration, soft colors, age-appropriate, clear, friendly, vector style, white background`;
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: enhancedPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo generar la imagen');
      
      updateSlide(active, { imageUrl: data.url, imageAlt: aiImagePrompt.trim() });
      setShowImagePicker(false);
      setAiImagePrompt('');
    } catch (e) {
      setImageError(e.message || 'Error de comunicación con el generador de imágenes.');
    } finally {
      setGeneratingImage(false);
    }
  }

  const hasMedia = current && (current.imageUrl || current.linkUrl);
  const currentBodyHtml = React.useMemo(
    () => markdownToHtmlForEditor(current?.body || ''),
    [current?.body, active]
  );
  const currentLayout = normalizeSlideLayout(current?.layout || defaultSlideLayout());
  const currentStyle = normalizeSlideStyle(current?.style || defaultSlideStyle());
  const currentType = normalizeSlideType(current?.type, active);
  const currentTypeLabel = SLIDE_TYPE_OPTIONS.find(option => option.value === currentType)?.label || 'Concepto';

  return (
    <>
      <div className="tm-studio">
        <header className="tm-studio-topbar">
          <div className="tm-studio-brand">
            <span className="tm-studio-mark" aria-hidden="true">◆</span>
            <div className="tm-studio-brand-text">
              <span className="tm-studio-eyebrow">Studio</span>
              <span className="tm-studio-counter">
                <strong>{String(active + 1).padStart(2, '0')}</strong>
                <span className="slash" aria-hidden="true">/</span>
                <span className="total">{String(slides.length).padStart(2, '0')}</span>
                <span className="label">diapositivas</span>
              </span>
            </div>
          </div>
          <div className="tm-studio-top-actions">
            <button type="button" className="tm-studio-btn" onClick={duplicateSlide} title="Duplicar esta diapositiva">
              <span aria-hidden="true">⎘</span> Duplicar
            </button>
            <button type="button" className="tm-studio-btn danger" onClick={() => removeSlide(active)} title="Eliminar esta diapositiva">
              <span aria-hidden="true">✕</span> Eliminar
            </button>
            <button type="button" className="tm-studio-btn primary" onClick={() => setPresenting(true)} title="Iniciar presentación (pantalla completa)">
              <span className="play" aria-hidden="true">▶</span> Presentar
            </button>
          </div>
        </header>

        <div className="tm-studio-body" style={{ gridTemplateColumns: showInspector && hasMedia ? '240px 1fr 280px' : '240px 1fr' }}>
          <aside className="tm-studio-rail" aria-label="Lista de diapositivas">
            <button type="button" className="tm-studio-rail-add" onClick={addSlide}>
              <span aria-hidden="true">＋</span> Nueva diapositiva
            </button>
            <ol className="tm-studio-rail-list">
              {slides.map((slide, i) => {
                const role = normalizeSlideType(slide.type, i);
                const roleLabel = SLIDE_TYPE_OPTIONS.find(o => o.value === role)?.label || 'Concepto';
                return (
                  <li key={`${i}-${slide.title}`}>
                    <button
                      type="button"
                      className={`tm-studio-rail-item ${i === active ? 'active' : ''}`}
                      onClick={() => setActive(i)}
                    >
                      <span className="num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="meta">
                        <span className={`role role-${role}`}>{roleLabel}</span>
                        <strong className="title">{slide.title || 'Sin título'}</strong>
                      </div>
                      {slide.imageUrl && <span className="badge" title="Con imagen" aria-hidden="true">◐</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          {current && (
            <main className="tm-studio-stage">
              <div className="tm-studio-toolbar" role="toolbar" aria-label="Edición">
                <div className="tg">
                  <select
                    className="ti"
                    value={currentStyle.fontFace}
                    onChange={(e) => updateSlideStyle({ fontFace: e.target.value })}
                    title="Tipografía"
                  >
                    {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                  </select>
                  <select
                    className="ti narrow"
                    value={currentStyle.bodySize}
                    onChange={(e) => {
                      const bodySize = Number(e.target.value);
                      updateSlideStyle({ bodySize, titleSize: Math.min(42, bodySize + 12) });
                    }}
                    title="Tamaño de cuerpo"
                  >
                    {[14, 16, 18, 20, 22, 24, 26].map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                  <select
                    className="ti"
                    value={currentType}
                    onChange={(e) => updateSlide(active, { type: normalizeSlideType(e.target.value, active) })}
                    title="Rol pedagógico"
                  >
                    {SLIDE_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>

                <div className="tg">
                  <button type="button" title="Negrita" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('bold', false)}><strong>B</strong></button>
                  <button type="button" title="Itálica" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('italic', false)}><em>I</em></button>
                  <button type="button" title="Lista" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('insertUnorderedList', false)}>• Lista</button>
                </div>

                <div className="tg align">
                  <button type="button" title="Alinear izquierda" className={current.align === 'left' ? 'active' : ''} onClick={() => updateSlide(active, { align: 'left' })} aria-label="Alinear izquierda">⟵</button>
                  <button type="button" title="Centrar" className={current.align === 'center' ? 'active' : ''} onClick={() => updateSlide(active, { align: 'center' })} aria-label="Centrar">↔</button>
                  <button type="button" title="Alinear derecha" className={current.align === 'right' ? 'active' : ''} onClick={() => updateSlide(active, { align: 'right' })} aria-label="Alinear derecha">⟶</button>
                </div>

                <div className="tg insert">
                  <button type="button" onClick={() => setShowImagePicker(true)} title="Añadir imagen o generar con IA">
                    <span aria-hidden="true">＋</span> Imagen
                  </button>
                  <button type="button" onClick={() => updateSlide(active, { linkUrl: current.linkUrl || 'https://', linkText: current.linkText || 'Recurso' })} title="Añadir enlace">
                    <span aria-hidden="true">＋</span> Enlace
                  </button>
                  {hasMedia && (
                    <button type="button" className={showInspector ? 'active' : ''} onClick={() => setShowInspector(!showInspector)} title="Propiedades del recurso">
                      ⚙ Propiedades
                    </button>
                  )}
                </div>

                <div className="tg right">
                  <button type="button" title="Deshacer" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('undo', false)}>↶</button>
                  <button type="button" title="Rehacer" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('redo', false)}>↷</button>
                </div>
              </div>

              <section className="tm-studio-canvas-wrap" aria-label={`Diapositiva ${active + 1}`}>
                <div className="tm-studio-canvas-frame" key={active}>
                  <div className={`tm-slide-canvas ${current.imageUrl ? 'has-image' : ''}`} style={{ textAlign: current.align || 'left' }}>
                    <div className="tm-slide-canvas-content" aria-hidden="true" />
                    <MovableSlideBox
                      box={currentLayout.title}
                      label="Titulo"
                      className="title-box"
                      onMove={(box) => updateLayoutPart('title', box)}
                    >
                      <input
                        className="tm-slide-title-input"
                        value={current.title}
                        onChange={(e) => updateSlide(active, { title: e.target.value })}
                        placeholder="Título de la diapositiva"
                        style={{
                          textAlign: current.align || 'left',
                          fontFamily: `${currentStyle.fontFace}, system-ui, sans-serif`,
                          fontSize: `${currentStyle.titleSize}px`,
                        }}
                      />
                    </MovableSlideBox>
                    <MovableSlideBox
                      box={currentLayout.body}
                      label="Texto"
                      className="body-box"
                      onMove={(box) => updateLayoutPart('body', box)}
                    >
                      <SlideBodyEditor
                        html={currentBodyHtml}
                        align={current.align || 'left'}
                        slideIndex={active}
                        style={currentStyle}
                        onChange={(newHtml) => {
                          const newMarkdown = htmlToMarkdown(newHtml);
                          updateSlide(active, { body: newMarkdown });
                        }}
                      />
                    </MovableSlideBox>

                    {current.imageUrl ? (
                      <div
                        className="tm-slide-canvas-image"
                        style={{
                          left: `${(currentLayout.image.x / SLIDE_CANVAS.w) * 100}%`,
                          top: `${(currentLayout.image.y / SLIDE_CANVAS.h) * 100}%`,
                          width: `${(currentLayout.image.w / SLIDE_CANVAS.w) * 100}%`,
                          height: `${(currentLayout.image.h / SLIDE_CANVAS.h) * 100}%`,
                        }}
                      >
                        <button
                          type="button"
                          className="tm-slide-drag-handle image-handle"
                          onPointerDown={beginImageDrag}
                          title="Mover imagen"
                        >
                          Imagen
                        </button>
                        <img src={current.imageUrl} alt={current.imageAlt || ''} />
                        <button
                          type="button"
                          className="tm-slide-image-remove"
                          onClick={() => updateSlide(active, { imageUrl: '', imageAlt: '' })}
                          title="Eliminar imagen"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="tm-canvas-add-image-placeholder"
                        onClick={() => setShowImagePicker(true)}
                        title="Añadir imagen o generar con IA"
                      >
                        <span>＋ Imagen o IA</span>
                      </button>
                    )}

                    {current.linkUrl && (
                      <a className="tm-slide-link-chip" href={current.linkUrl} target="_blank" rel="noopener noreferrer">
                        🔗 {current.linkText || current.linkUrl}
                      </a>
                    )}
                  </div>
                </div>
              </section>

              <div className="tm-studio-sidekick">
                <details className="tm-studio-collapsible" open={showIntent} onToggle={(e) => setShowIntent(e.currentTarget.open)}>
                  <summary>
                    <span className="dot intent" aria-hidden="true" />
                    Intención pedagógica
                    <span className={`role-tag role-${currentType}`}>{currentTypeLabel}</span>
                  </summary>
                  <div className="tm-studio-collapsible-body grid2">
                    <label>
                      <span>Idea central</span>
                      <input
                        value={current.claim || ''}
                        onChange={(e) => updateSlide(active, { claim: e.target.value })}
                        placeholder="Qué debe entender o hacer el estudiante"
                      />
                    </label>
                    <label>
                      <span>Visual</span>
                      <input
                        value={current.visualIntent || ''}
                        onChange={(e) => updateSlide(active, { visualIntent: e.target.value })}
                        placeholder="Qué debería mostrar el apoyo visual"
                      />
                    </label>
                  </div>
                </details>

                <details className="tm-studio-collapsible" open={showNotes} onToggle={(e) => setShowNotes(e.currentTarget.open)}>
                  <summary>
                    <span className="dot notes" aria-hidden="true" />
                    Notas del maestro
                    <span className="muted">para guiar la lección</span>
                  </summary>
                  <div className="tm-studio-collapsible-body">
                    <textarea
                      className="tm-studio-notes-textarea"
                      value={current.notes || ''}
                      onChange={(e) => updateSlide(active, { notes: e.target.value })}
                      placeholder="Directrices pedagógicas o notas para presentar esta diapositiva..."
                    />
                  </div>
                </details>
              </div>
            </main>
          )}

          {showInspector && hasMedia && (
            <aside className="tm-studio-inspector" aria-label="Propiedades del recurso">
              <header className="tm-studio-inspector-head">
                <strong>Propiedades</strong>
                <button type="button" className="tm-studio-inspector-close" onClick={() => setShowInspector(false)} aria-label="Cerrar">✕</button>
              </header>
              {current.imageUrl && (
                <div className="tm-studio-inspector-box">
                  <span className="title">🖼 Imagen</span>
                  <label>
                    <small>URL</small>
                    <input
                      value={current.imageUrl || ''}
                      onChange={(e) => updateSlide(active, { imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </label>
                  <label>
                    <small>Descripción (alt)</small>
                    <input
                      value={current.imageAlt || ''}
                      onChange={(e) => updateSlide(active, { imageAlt: e.target.value })}
                      placeholder="Descripción breve de la imagen"
                    />
                  </label>
                </div>
              )}
              {current.linkUrl && (
                <div className="tm-studio-inspector-box">
                  <span className="title">🔗 Enlace</span>
                  <label>
                    <small>Texto</small>
                    <input
                      value={current.linkText || ''}
                      onChange={(e) => updateSlide(active, { linkText: e.target.value })}
                      placeholder="Recurso, video, lectura..."
                    />
                  </label>
                  <label>
                    <small>URL</small>
                    <input
                      value={current.linkUrl || ''}
                      onChange={(e) => updateSlide(active, { linkUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </label>
                </div>
              )}
            </aside>
          )}
        </div>

      {showImagePicker && (
        <div className="tm-image-picker-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowImagePicker(false); }}>
          <div className="tm-image-picker-card">
            <header className="tm-image-picker-header">
              <h3>Añadir imagen a la diapositiva</h3>
              <button type="button" className="tm-image-picker-close" onClick={() => setShowImagePicker(false)}>×</button>
            </header>
            
            <div className="tm-image-picker-body">
              <div className="tm-image-picker-section">
                <h4>🎨 Generar Ilustración con IA</h4>
                <p>Ingresa una descripción del concepto pedagógico para crear una imagen limpia automáticamente.</p>
                <div className="tm-ai-prompt-box">
                  <input
                    type="text"
                    placeholder="Ej: Un coquí de Puerto Rico cantando sobre una hoja verde por la noche..."
                    value={aiImagePrompt}
                    onChange={(e) => setAiImagePrompt(e.target.value)}
                    disabled={generatingImage}
                  />
                  <button
                    type="button"
                    className="tm-btn primary"
                    onClick={handleGenerateAIImage}
                    disabled={generatingImage || !aiImagePrompt.trim()}
                  >
                    {generatingImage ? 'Generando...' : 'Generar con IA'}
                  </button>
                </div>
                {generatingImage && (
                  <div className="tm-ai-image-loader">
                    <span className="tm-spinner" /> Generando imagen con FLUX. Esto toma unos 10 segundos...
                  </div>
                )}
              </div>

              <div className="tm-image-picker-section">
                <h4>📁 Subir desde tu computadora</h4>
                <p>Sube un archivo JPG, PNG o SVG desde tu disco local.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageUpload}
                  id="canvas-local-img-upload"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="tm-btn secondary"
                  onClick={() => document.getElementById('canvas-local-img-upload').click()}
                >
                  Seleccionar archivo de imagen
                </button>
              </div>

              <div className="tm-image-picker-section">
                <h4>🔗 Dirección Web (URL)</h4>
                <p>Pega el enlace de una imagen existente en internet.</p>
                <div className="tm-url-input-box">
                  <input
                    type="text"
                    placeholder="https://ejemplo.com/mi-imagen.jpg"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="tm-btn secondary"
                    onClick={() => {
                      if (customImageUrl.trim()) {
                        updateSlide(active, { imageUrl: customImageUrl.trim(), imageAlt: current.title });
                        setShowImagePicker(false);
                        setCustomImageUrl('');
                      }
                    }}
                    disabled={!customImageUrl.trim()}
                  >
                    Añadir URL
                  </button>
                </div>
              </div>

              {imageError && <div className="tm-image-picker-error">⚠️ {imageError}</div>}
            </div>
          </div>
        </div>
      )}
      </div>

      {presenting && (
        <PresentationMode
          slides={slides}
          startAt={active}
          onExit={() => setPresenting(false)}
        />
      )}
    </>
  );
}

function DocumentWorkspace({ value, onChange }) {
  const [docMode, setDocMode] = React.useState('preview'); // edit | preview
  const visibleValue = stripEditorMetadata(value);

  return (
    <div className="tm-doc-workspace">
      <div className="tm-doc-toolbar">
        <div className="tm-doc-mode-selector">
          <button
            type="button"
            className={docMode === 'edit' ? 'active' : ''}
            onClick={() => setDocMode('edit')}
          >
            ✏️ Editor Texto
          </button>
          <button
            type="button"
            className={docMode === 'preview' ? 'active' : ''}
            onClick={() => setDocMode('preview')}
          >
            👁️ Vista Previa
          </button>
        </div>
      </div>
      <div className={`tm-doc-body mode-${docMode}`}>
        {docMode === 'edit' && (
          <textarea
            className="tm-doc-textarea"
            value={visibleValue}
            onChange={(e) => onChange(e.target.value)}
            spellCheck
            placeholder="Edita el contenido aqui..."
          />
        )}
        {docMode === 'preview' && (
          <div className="tm-doc-preview tm-md" dangerouslySetInnerHTML={{ __html: mdToHtml(visibleValue) }} />
        )}
      </div>
    </div>
  );
}

function WorksheetWorkspace({ value, onChange, title }) {
  const visibleValue = stripEditorMetadata(value);
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
            dangerouslySetInnerHTML={{ __html: mdToHtml(visibleValue) }}
          />
        </div>
      </div>
      <label className="tm-work-editor">
        <span>Contenido editable de la hoja</span>
        <textarea value={visibleValue} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

// Visible "Athenas lesson loaded" card. Lets the teacher confirm what the AI
// will actually analyze, instead of trusting an opaque text dump in a textarea.
// Body of the lesson is expandable so the form stays compact by default.
function AthenasLessonCard({ lesson, onRemove }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!lesson) return null;
  const desc = stripDefinitionHtml(lesson.description || '');
  const concept = stripDefinitionHtml(lesson.concept || '');
  const stdCount  = (lesson.standards || []).length;
  const defsCount = (lesson.definitions || []).length;
  const objsCount = (lesson.objectives || []).length;
  const exCount   = (lesson.examples || []).length;
  return (
    <div className="tm-athenas-card">
      <div className="tm-athenas-card-head">
        <div className="tm-athenas-card-title">
          <span className="tm-athenas-card-icon">📘</span>
          <div>
            <div className="tm-athenas-card-name">{lesson.title || 'Lección Athenas'}</div>
            <div className="tm-athenas-card-meta">
              {lesson.subjectCode && <span>{lesson.subjectCode}</span>}
              {lesson.levelCode && <><span>·</span><span>Grado {lesson.levelCode}</span></>}
              {lesson.lessonNo && <><span>·</span><span>Lección {lesson.lessonNo}</span></>}
              {lesson.blueprint && <span className="tm-athenas-pill blueprint">📐 Blueprint</span>}
              {lesson.isGapClosing && <span className="tm-athenas-pill gap">🌉 Gap closing</span>}
            </div>
          </div>
        </div>
        <button type="button" className="tm-athenas-card-remove" onClick={onRemove} title="Quitar lección">✕</button>
      </div>

      <div className="tm-athenas-card-stats">
        <span><strong>{stdCount}</strong> estándares</span>
        <span><strong>{objsCount}</strong> objetivos</span>
        <span><strong>{defsCount}</strong> conceptos / definiciones</span>
        <span><strong>{exCount}</strong> ejemplos</span>
      </div>

      {(lesson.standards || []).length > 0 && (
        <div className="tm-athenas-card-standards">
          {lesson.standards.slice(0, 6).map((s, i) => (
            <span key={i} className="tm-athenas-std-chip" title={s.Description || ''}>{s.Code}</span>
          ))}
          {lesson.standards.length > 6 && <span className="tm-athenas-std-more">+{lesson.standards.length - 6}</span>}
        </div>
      )}

      <button type="button" className="tm-athenas-card-toggle" onClick={() => setExpanded(e => !e)}>
        {expanded ? '▾ Ocultar contenido completo' : '▸ Ver contenido completo de la lección'}
      </button>

      {expanded && (
        <div className="tm-athenas-card-body">
          {concept && (
            <div className="tm-athenas-section">
              <div className="tm-athenas-section-title">Concepto central</div>
              <div className="tm-athenas-section-text">{concept}</div>
            </div>
          )}
          {desc && (
            <div className="tm-athenas-section">
              <div className="tm-athenas-section-title">Descripción / cuerpo de la lección</div>
              <div className="tm-athenas-section-text">{desc}</div>
            </div>
          )}
          {objsCount > 0 && (
            <div className="tm-athenas-section">
              <div className="tm-athenas-section-title">Objetivos de aprendizaje</div>
              <ul className="tm-athenas-section-list">
                {lesson.objectives.map((o, i) => {
                  const t = stripDefinitionHtml(o.Desc || o.Description || '');
                  return t ? <li key={i}>{t}</li> : null;
                })}
              </ul>
            </div>
          )}
          {defsCount > 0 && (
            <div className="tm-athenas-section">
              <div className="tm-athenas-section-title">Conceptos / Definiciones</div>
              <ul className="tm-athenas-section-list">
                {lesson.definitions.map((d, i) => {
                  const term = d.Name || '';
                  const body = stripDefinitionHtml(d.Desc || d.Description || '');
                  return (term || body) ? <li key={i}><strong>{term}</strong>{term && body ? ': ' : ''}{body}</li> : null;
                })}
              </ul>
            </div>
          )}
          {exCount > 0 && (
            <div className="tm-athenas-section">
              <div className="tm-athenas-section-title">Ejemplos pedagógicos</div>
              <ul className="tm-athenas-section-list">
                {lesson.examples.map((e, i) => {
                  const name = e.Name || '';
                  const body = stripDefinitionHtml(e.Desc || e.Description || '');
                  return (name || body) ? <li key={i}>{name && <strong>{name}: </strong>}{body}</li> : null;
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Download options collapsed into a single ⬇ dropdown so the header doesn't
// show a row of competing buttons.
function DownloadMenu({ exporting, onPDF, onPPTX, onWorksheet }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const run = (fn) => { setOpen(false); fn(); };

  return (
    <div className="tm-download-menu" ref={ref}>
      <button
        type="button"
        className="tm-action-btn tm-download-trigger"
        onClick={() => setOpen(o => !o)}
        disabled={!!exporting}
        title="Opciones de descarga"
      >
        {exporting ? '⏳' : '⬇'} Descargar <span className="tm-caret">▾</span>
      </button>
      {open && (
        <div className="tm-download-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => run(onPDF)}>📄 PDF (imprimible)</button>
          <button type="button" role="menuitem" onClick={() => run(onPPTX)}>📊 PowerPoint (.pptx)</button>
          <button type="button" role="menuitem" onClick={() => run(onWorksheet)}>📝 Hoja de trabajo</button>
        </div>
      )}
    </div>
  );
}

function ToolModal({ tool, onClose, embedded = false, initialValues = null, onSwitchTool = null }) {
  // Single default model for all tools — picker removed from the UI by request.
  // To swap models later, change DEFAULT_AI_MODEL or restore the dropdown below.
  const DEFAULT_AI_MODEL = 'openai/gpt-4o-mini';
  const [model] = React.useState(DEFAULT_AI_MODEL);
  const initial = React.useMemo(() => {
    const base = Object.fromEntries(tool.fields.map(f => [
      f.name,
      f.default ?? (f.type === 'standards' ? [] : ''),
    ]));
    // Apply any initial values from a parent (e.g. follow-up workflows like
    // Pruebas Diagnósticas → Plan de Intervención para Rezago).
    if (initialValues) {
      for (const k of Object.keys(initialValues)) {
        if (initialValues[k] !== undefined && initialValues[k] !== null) {
          base[k] = initialValues[k];
        }
      }
    }
    return base;
  }, [tool, initialValues]);
  const [values, setValues] = React.useState(initial);
  const [output, setOutput] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | streaming | done | error
  const [error, setError]   = React.useState('');
  const [history, setHistory] = React.useState([]); // for chat-mode tools
  const [savedDoc, setSavedDoc]   = React.useState(null);
  const [imageStatus, setImageStatus] = React.useState(''); // '' | 'generating-3-of-5' | 'done'
  const [showForm, setShowForm] = React.useState(true);
  // viewMode: 'document' (default printable preview) | 'presentation' | 'worksheet'
  const [viewMode, setViewMode] = React.useState('document');
  const [presentationMarkdown, setPresentationMarkdown] = React.useState('');
  const [converting, setConverting] = React.useState(''); // '' | 'presentation'
  const [athenasAction, setAthenasAction] = React.useState('profundizar');
  // Map of fieldName → structured Athenas lesson, so we can render a visible
  // "lesson loaded" card on top of the textarea (the prompt still uses the
  // formatted reference text stored in values[fieldName]).
  const [pickedLessons, setPickedLessons] = React.useState({});
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
    setShowForm(true);
    setViewMode('document');
    setPresentationMarkdown('');   // invalidate any prior conversion
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
      acc = cleanGeneratedOutput(acc);
      setOutput(acc);

      setShowForm(false);
      setViewMode('document');   // always land on the printable document view

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

  // Collect an SSE /api/generate stream into a single string (non-incremental).
  async function streamToString({ system, user }) {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, system, user }),
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = '', buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop() ?? '';
      for (const l of lines) {
        if (!l.startsWith('data:')) continue;
        const p = l.slice(5).trim();
        if (p === '[DONE]') continue;
        try { const j = JSON.parse(p); if (j.error) throw new Error(j.error); if (j.delta) acc += j.delta; } catch {}
      }
    }
    return acc;
  }

  // "Convertir a Presentación" — a dedicated AI pass restructures the document
  // into clean slide markdown, THEN opens the slide editor. Cached so a second
  // click just re-opens the editor without re-spending tokens.
  async function convertToPresentation() {
    if (presentationMarkdown) { setViewMode('presentation'); return; }
    setConverting('presentation');
    setError('');
    try {
      const sys = `Eres un diseñador instruccional experto y director de arte educativo. Conviertes contenido educativo en una PRESENTACIÓN de diapositivas clara, visual y lista para proyectar en el salón.

Reglas de estructura:
- Primera línea: "# " con el título de la presentación (una sola vez).
- Cada diapositiva empieza con "## " y su título.
- Bajo cada "##", usa bullets cortos con "- " (máximo 5 por slide; frases concisas, NO párrafos largos).
- Divide en 7-12 diapositivas con flujo lógico: activación, objetivo, conceptos clave, ejemplo, comparación o proceso cuando aplique, actividad, repaso y cierre.
- Para cada diapositiva incluye estos metadatos HTML, cada uno en su propia línea:
  <!-- type: hook|objective|concept|example|comparison|process|activity|recap|exit -->
  <!-- claim: una oración con la idea central que la diapositiva debe probar o lograr -->
  <!-- visual: intención visual concreta para la composición o imagen -->
- Varía los tipos de diapositiva; no uses "concept" en todas.
- Los títulos deben ser pedagógicos y específicos, no "Introducción" ni "Contenido".
- Cuando una diapositiva se beneficie de una imagen, incluye un tag [IMAGE: prompt detallado en INGLÉS, estilo "clean educational illustration"].
- NO incluyas claves de respuestas largas ni notas internas del maestro como diapositivas.
- Mantén el español del contenido original.
Responde SOLO con el markdown de la presentación, sin explicaciones.`;
      const user = `Convierte este contenido en una presentación de diapositivas:\n\n"""\n${output}\n"""`;
      let md = await streamToString({ system: sys, user });
      md = await resolveImageTags(md, () => {}, setImageStatus);
      md = cleanGeneratedOutput(md);
      setPresentationMarkdown(md);
      setViewMode('presentation');
    } catch (e) {
      setError('No pude convertir a presentación: ' + (e.message || e));
    } finally {
      setConverting('');
    }
  }

  function copyOut() {
    navigator.clipboard.writeText(output).then(() => {
      const el = document.querySelector('.tm-copy');
      if (el) { el.classList.add('ok'); setTimeout(() => el.classList.remove('ok'), 1200); }
    });
  }

  const safeTitle = tool.title.replace(/\s+/g, '_');
  const [exporting, setExporting] = React.useState('');
  const [interactiveError, setInteractiveError] = React.useState('');
  const chatHasAthenasLesson = isChat && /LECCI|ATHENAS|Est[aÃ¡]ndares cubiertos|Conceptos \/ Definiciones/i.test(String(values.pregunta || ''));
  // Tools opt-in via tool.canMakeInteractive in toolsConfig — any assessment-shaped
  // output (numbered items + answer key) can be converted to an interactive assessment.
  const canMakeInteractive = !!tool.canMakeInteractive;

  async function handleExportPDF() {
    setExporting('pdf');
    try { exportMarkdownPDF(output, `${safeTitle}.pdf`, tool.title); }
    finally { setExporting(''); }
  }
  async function handleExportPPTX() {
    setExporting('pptx');
    // Prefer the AI-restructured slide markdown if the user converted; else
    // fall back to splitting the raw document.
    const source = presentationMarkdown || output;
    try { await exportPPTX(source, `${safeTitle}.pptx`, tool.title); }
    finally { setExporting(''); }
  }
  function handleExportWorksheet() {
    setExporting('worksheet');
    try { exportWorksheet(output, `${safeTitle}_worksheet.pdf`, tool.title); }
    finally { setExporting(''); }
  }

  /**
   * Bridge from Pruebas Diagnósticas → Plan de Intervención para Rezago.
   * Extracts a brechas seed from the diagnostic output and opens the
   * intervention tool with materia / grado / estándares / brechas pre-filled.
   * The parent (AIToolsPage) handles the actual tool switch via onSwitchTool.
   */
  function handleSwitchToIntervention() {
    if (!onSwitchTool) return;

    // Extract a focused summary of the diagnostic for the brechas field.
    // The Plan de Intervención prompt is robust enough to digest raw output,
    // so we hand it the topic + a truncated dump of what was generated.
    const topic = values.unidad || values.tema || 'tema del diagnóstico';
    const truncated = (output || '').slice(0, 1800);
    const brechasSeed = `Resultados de la Prueba Diagnóstica aplicada sobre: "${topic}".

Asume que varios estudiantes mostraron debilidad en los conceptos centrales de este diagnóstico. Identifica los prerrequisitos faltantes a partir del contenido del pre-test:

${truncated}`;

    onSwitchTool('Plan de Intervención para Rezago', {
      materia:    values.materia,
      grado:      values.grado,
      severidad:  'Brechas específicas (no atraso global)',
      brechas:    brechasSeed,
      estandares: Array.isArray(values.estandares) ? values.estandares : [],
    });
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
          // Subject comes from the tool's form (any subject), fallback to Matemáticas
          // for the legacy Examen de Matemáticas tool which doesn't expose materia.
          subject: values.materia || 'Matemáticas',
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

  const showWorkspaceHeader = status !== 'streaming' && output !== '';

  return (
    <div
      className={embedded ? 'tm-workspace-shell' : 'tm-backdrop'}
      onMouseDown={(e) => { if (!embedded && e.target === e.currentTarget) onClose(); }}
    >
      <div className={`tm-modal ${embedded ? 'embedded' : ''}`} role={embedded ? 'region' : 'dialog'} aria-label={tool.title}>
        {showWorkspaceHeader ? (
          <header className="tm-suite-head">
            <div className="tm-suite-header-left">
              <button type="button" className="tm-suite-back-btn" onClick={onClose} aria-label={embedded ? 'Volver a herramientas' : 'Cerrar'}>
                ← Volver
              </button>
              <div className="tm-suite-title-area">
                <h3>{tool.title}</h3>
              </div>
            </div>

            <div className="tm-suite-actions" role="toolbar" aria-label="Acciones del documento">
              {viewMode !== 'document' && (
                <button
                  type="button"
                  className="tm-action-btn ghost"
                  onClick={() => setViewMode('document')}
                  title="Regresar a la vista del documento"
                >
                  ← Volver al documento
                </button>
              )}

              {viewMode === 'document' && (
                <>
                  <button
                    type="button"
                    className="tm-action-btn convert"
                    onClick={convertToPresentation}
                    disabled={!!converting}
                    title="La IA reestructura el contenido en una presentación editable"
                  >
                    {converting === 'presentation' ? '⏳ Convirtiendo…' : '📊 Convertir a Presentación'}
                  </button>
                  <button
                    type="button"
                    className="tm-action-btn worksheet"
                    onClick={() => setViewMode('worksheet')}
                    title="Crea una hoja de trabajo imprimible con espacio para respuestas"
                  >
                    📝 Generar Hoja de trabajo
                  </button>
                </>
              )}

              <DownloadMenu
                exporting={exporting}
                onPDF={handleExportPDF}
                onPPTX={handleExportPPTX}
                onWorksheet={handleExportWorksheet}
              />

              <button type="button" className="tm-copy tm-action-btn" onClick={copyOut} title="Copiar al portapapeles">📋 Copiar</button>

              {canMakeInteractive && (
                <button type="button" className="tm-action-btn" onClick={handleMakeInteractive} disabled={!!exporting} title="Crear sesión con QR para estudiantes">
                  {exporting === 'interactive' ? '⏳' : '▦'} Interactivo
                </button>
              )}
              {tool.suggestsInterventionPlan && onSwitchTool && (
                <button
                  type="button"
                  className="tm-action-btn"
                  onClick={handleSwitchToIntervention}
                  title="Genera un Plan de Intervención para Rezago pre-llenado con los datos de esta prueba diagnóstica"
                  style={{ background: '#FFE9D6', color: '#A8521A', fontWeight: 700 }}
                >
                  🫶 Plan de intervención
                </button>
              )}

              <button
                type="button"
                className={`tm-header-toggle-form ${showForm ? 'active' : ''}`}
                onClick={() => setShowForm(!showForm)}
                title="Alternar parámetros de entrada"
              >
                ⚙️ Parámetros
              </button>
            </div>
          </header>
        ) : (
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
        )}

        <div className={`tm-body ${showForm ? '' : 'form-collapsed'}`}>
          <form className="tm-form" onSubmit={generate}>
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
                            setPickedLessons(prev => ({ ...prev, [f.name]: lesson }));
                          }}
                        />
                      </span>
                    )}
                  </span>
                  {f.type === 'textarea' ? (
                    pickedLessons[f.name] ? (
                      <AthenasLessonCard
                        lesson={pickedLessons[f.name]}
                        onRemove={() => {
                          setPickedLessons(prev => {
                            const next = { ...prev };
                            delete next[f.name];
                            return next;
                          });
                          setField(f.name, '');
                        }}
                      />
                    ) : (
                    <textarea
                      rows={f.rows || 4}
                      placeholder={f.placeholder}
                      value={values[f.name]}
                      onChange={(e) => setField(f.name, e.target.value)}
                    />
                    )
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
            {!showWorkspaceHeader && (
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
                    <button type="button" className="tm-copy" onClick={copyOut} title="Copiar al portapapeles">📋 Copiar</button>
                    <button type="button" onClick={handleExportPDF} disabled={!!exporting} title="Descargar como PDF">
                      {exporting === 'pdf' ? '⏳' : '📄'} PDF
                    </button>
                    <button type="button" onClick={handleExportPPTX} disabled={!!exporting} title="Descargar como PowerPoint">
                      {exporting === 'pptx' ? '⏳' : '📊'} PPTX
                    </button>
                    <button type="button" onClick={handleExportWorksheet} disabled={!!exporting} title="Descargar como hoja de trabajo (con espacio para respuestas)">
                      {exporting === 'worksheet' ? '⏳' : '📝'} Worksheet
                    </button>
                    {canMakeInteractive && (
                      <button type="button" onClick={handleMakeInteractive} disabled={!!exporting} title="Crear sesión con QR para estudiantes">
                        {exporting === 'interactive' ? '⏳' : '▦'} Interactivo
                      </button>
                    )}
                    {tool.suggestsInterventionPlan && onSwitchTool && (
                      <button
                        type="button"
                        onClick={handleSwitchToIntervention}
                        title="Genera un Plan de Intervención para Rezago pre-llenado con los datos de esta prueba diagnóstica"
                        style={{ background: '#FFE9D6', color: '#A8521A', fontWeight: 700 }}
                      >
                        🫶 Plan de intervención
                      </button>
                    )}
                    <button type="button" onClick={generate} title="Regenerar">↻ Regenerar</button>
                  </div>
                )}
              </div>
            )}
            {interactiveError && <div className="tm-inline-error">{interactiveError}</div>}

            {error ? (
              <pre className="tm-error">{error}</pre>
            ) : status === 'streaming' ? (
              <div ref={outRef} className="tm-md" dangerouslySetInnerHTML={{ __html: mdToHtml(output) }} />
            ) : output ? (
              <>
                {viewMode === 'document' && (
                  <DocumentWorkspace value={output} onChange={setOutput} />
                )}
                {viewMode === 'presentation' && (
                  <SlideWorkspace value={presentationMarkdown} onChange={setPresentationMarkdown} />
                )}
                {viewMode === 'worksheet' && (
                  <WorksheetWorkspace value={output} onChange={setOutput} title={tool.title} />
                )}
              </>
            ) : (
              <div className="tm-out-placeholder">
                <span className="tm-dim">El resultado generado aparecerá aquí...</span>
              </div>
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
