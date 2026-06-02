/**
 * Export utilities — convert AI tool output into downloadable files.
 *   - exportPDF(htmlNode, filename)       — visual fidelity via html2canvas + jsPDF
 *   - exportPPTX(markdown, filename, title) — converts markdown into slide deck
 *   - exportWorksheet(markdown, filename, title) — student-facing worksheet (PDF)
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';

const NAVY = '#27466C';
const TEAL = '#3DA8A8';
const AMBER = '#E89B1E';

function latexToReadable(text = '') {
  return String(text)
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => `\n${latexToReadable(m)}\n`)
    .replace(/\$([^$\n]+?)\$/g, (_, m) => latexToReadable(m))
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, 'sqrt($1)')
    .replace(/\\left|\\right/g, '')
    .replace(/\\times/g, 'x')
    .replace(/\\div/g, '/')
    .replace(/\\cdot/g, '*')
    .replace(/\\leq/g, '<=')
    .replace(/\\geq/g, '>=')
    .replace(/\\neq/g, '!=')
    .replace(/\\pi/g, 'pi')
    .replace(/\\theta/g, 'theta')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\degree/g, ' degrees')
    .replace(/\^\\circ/g, ' degrees')
    .replace(/\^{([^{}]+)}/g, '^$1')
    .replace(/_{([^{}]+)}/g, '_$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '');
}

function sanitizePdfText(text = '') {
  return String(text)
    .normalize('NFKC')
    .replace(/✅|☑️|✔️|✔/g, '[OK]')
    .replace(/❌|✖️|✖/g, '[X]')
    .replace(/⭐|🌟|★/g, '*')
    .replace(/➡️|➜|→/g, '->')
    .replace(/⬅️|←/g, '<-')
    .replace(/📌|🔹|🔸|▪️|▫️|•/g, '-')
    .replace(/[\u200D\uFE0E\uFE0F]/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trimEnd();
}

function markdownToPlainLines(markdown = '') {
  return sanitizePdfText(latexToReadable(stripEditorMetadata(stripSlideNumberLabels(markdown))))
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '[imagen]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/\r/g, '')
    .split('\n');
}

function stripSlideNumberLabels(text = '') {
  return String(text).replace(
    /^(\s*(?:#{1,6}\s*|[-*]\s+|\d+[.)]\s+)?)\s*(?:diapositiva|dispositiva|slide)\s*\d+\s*[:.)-]?\s*/gim,
    (_, prefix = '') => prefix
  );
}

function stripEditorMetadata(text = '') {
  return String(text)
    .replace(/<!--\s*(?:layout|style):\s*[\s\S]*?-->/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  const safeText = sanitizePdfText(text);
  if (!safeText.trim()) return y;
  const lines = doc.splitTextToSize(safeText, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function exportMarkdownPDF(markdown, filename = 'documento.pdf', title = 'Documento') {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const marginTop = 20;
  const marginBottom = 16;
  const maxWidth = pageW - marginX * 2;
  let y = marginTop;

  function ensureSpace(needed = 10) {
    if (y + needed <= pageH - marginBottom) return;
    doc.addPage();
    y = marginTop;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(39, 70, 108);
  y = addWrappedText(doc, latexToReadable(title), marginX, y, maxWidth, 7) + 3;
  doc.setDrawColor(61, 168, 168);
  doc.line(marginX, y, pageW - marginX, y);
  y += 8;

  for (const raw of markdownToPlainLines(markdown)) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      y += 3;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)/);
    const bullet = line.match(/^\s*[-*]\s+(.+)/);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.+)/);

    ensureSpace(12);
    if (heading) {
      const level = heading[1].length;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(level === 1 ? 15 : level === 2 ? 13 : 11.5);
      doc.setTextColor(39, 70, 108);
      y += level === 1 ? 3 : 1;
      y = addWrappedText(doc, latexToReadable(heading[2]), marginX, y, maxWidth, 6.5) + 2;
      continue;
    }

    doc.setFont('helvetica', bullet || numbered ? 'bold' : 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(26, 39, 64);
    const text = bullet ? `- ${bullet[1]}` : numbered ? `${numbered[1]}. ${numbered[2]}` : line;
    y = addWrappedText(doc, latexToReadable(text), marginX, y, maxWidth, 5.5) + 1.5;
  }

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(130);
    doc.text(`Pagina ${i} de ${total}`, pageW / 2, pageH - 8, { align: 'center' });
  }
  doc.save(filename);
}

/* ─────────── PDF (rendered output) ─────────── */
export async function exportPDF(htmlNode, filename = 'documento.pdf') {
  if (!htmlNode) return;
  // Clone the node into an offscreen container with a white background and reflowed width
  // so the captured image is print-friendly (A4 portrait ~ 794px @ 96dpi).
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed; left: -10000px; top: 0;
    width: 794px; padding: 40px 48px; box-sizing: border-box;
    background: #fff; color: #1A2740;
    font-family: 'Poppins', system-ui, sans-serif; font-size: 13px; line-height: 1.55;
  `;
  wrapper.innerHTML = htmlNode.innerHTML;
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let y = 0;
    let remaining = imgH;
    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, -y, imgW, imgH);
      remaining -= pageH;
      if (remaining > 0) { pdf.addPage(); y += pageH; }
    }
    pdf.save(filename);
  } finally {
    wrapper.remove();
  }
}

/* ─────────── PPTX (slide deck from markdown) ─────────── */
export function exportPPTX(markdown, filename = 'presentacion.pptx', title = 'Presentación') {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Genial Skills';

  const smartSlides = parseMarkdownToSlides(markdown);
  const deck = buildDeckTheme(title, smartSlides);
  renderCoverSlide(pptx, pptx.addSlide(), deck);
  smartSlides.forEach((slide, index) => {
    const s = pptx.addSlide();
    renderSmartSlide(pptx, s, slide, index, deck);
    if (slide.notes) s.addNotes(slide.notes);
  });
  return pptx.writeFile({ fileName: filename });
}

const SLIDE_TYPE_LABELS = {
  hook: 'Activar',
  objective: 'Objetivo',
  concept: 'Concepto',
  example: 'Ejemplo',
  comparison: 'Comparar',
  process: 'Proceso',
  activity: 'Actividad',
  recap: 'Repaso',
  exit: 'Cierre',
};

const TYPE_ACCENTS = {
  hook: 'E86F3A',
  objective: '2A7F62',
  concept: '2F5DA8',
  example: '7A5AF8',
  comparison: 'C66A3D',
  process: '0F8B8D',
  activity: 'D9436E',
  recap: '4F5E70',
  exit: '1F7A8C',
};

const SUBJECT_THEMES = [
  { test: /ciencia|biolog|quim|fisic|ecosistema|materia|energia/i, bg: 'F4FAF8', ink: '143B3A', accent: '2A9D8F', accent2: 'E9C46A', soft: 'DDF3EE' },
  { test: /matem|geometr|algebra|fraccion|decimal|ecuaci/i, bg: 'F7F6FF', ink: '1E2454', accent: '5B6EE1', accent2: 'F2B705', soft: 'E7E9FF' },
  { test: /social|historia|geograf|civica|comunidad|econom/i, bg: 'FBF6EE', ink: '3D3024', accent: 'B85C38', accent2: '2F6F73', soft: 'F0E2CF' },
  { test: /espa|lectura|cuento|poema|vocabulario|escritura/i, bg: 'FFF8F7', ink: '402632', accent: 'C44569', accent2: '3B7A57', soft: 'F8DDE5' },
];

function buildDeckTheme(title, slides) {
  const text = `${title}\n${slides.map(s => `${s.title} ${s.body}`).join('\n')}`;
  const match = SUBJECT_THEMES.find(theme => theme.test.test(text));
  const base = match || { bg: 'F7F9FC', ink: '17233C', accent: '2F6FBB', accent2: 'F2A65A', soft: 'E5EEF8' };
  return {
    ...base,
    title: sanitizePdfText(title || slides[0]?.title || 'Presentacion'),
    fontFace: 'Poppins',
    displayFace: 'Georgia',
  };
}

function normalizeSlideType(type, index = 0) {
  const raw = String(type || '').trim().toLowerCase();
  if (raw === 'closing' || raw === 'exit-ticket') return 'exit';
  if (SLIDE_TYPE_LABELS[raw]) return raw;
  return index === 0 ? 'hook' : 'concept';
}

function renderCoverSlide(pptx, slide, deck) {
  slide.background = { color: deck.ink };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: deck.ink }, line: { transparency: 100 } });
  slide.addShape(pptx.ShapeType.ellipse, { x: 8.6, y: -1.0, w: 4.9, h: 4.9, fill: { color: deck.accent, transparency: 85 }, line: { color: deck.accent2, transparency: 30, pt: 2 } });
  slide.addShape(pptx.ShapeType.rect, { x: 0.7, y: 0.72, w: 1.15, h: 0.08, fill: { color: deck.accent }, line: { transparency: 100 } });
  slide.addText('PRESENTACION DE CLASE', { x: 0.7, y: 0.95, w: 3.8, h: 0.24, fontSize: 8.5, bold: true, color: deck.accent2, charSpace: 1.4, fontFace: deck.fontFace });
  slide.addText(deck.title, { x: 0.7, y: 2.05, w: 8.8, h: 1.85, fontSize: 40, bold: true, color: 'FFFFFF', fontFace: deck.displayFace, fit: 'shrink' });
  slide.addText('Genial Skills | IA Educativa', { x: 0.74, y: 6.55, w: 4.2, h: 0.32, fontSize: 11, color: 'D7DEE8', fontFace: deck.fontFace });
  slide.addShape(pptx.ShapeType.rect, { x: 10.2, y: 5.74, w: 2.15, h: 0.72, fill: { color: deck.accent }, line: { transparency: 100 } });
  slide.addText('Lista para ensenar', { x: 10.38, y: 5.95, w: 1.8, h: 0.2, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', fontFace: deck.fontFace });
}

function renderSmartSlide(pptx, s, slide, index, deck) {
  const type = normalizeSlideType(slide.type, index);
  const current = { ...slide, type };
  const renderer = {
    hook: renderHookSlide,
    objective: renderObjectiveSlide,
    concept: renderConceptSlide,
    example: renderExampleSlide,
    comparison: renderComparisonSlide,
    process: renderProcessSlide,
    activity: renderActivitySlide,
    recap: renderRecapSlide,
    exit: renderExitSlide,
  }[type] || renderConceptSlide;
  renderer(pptx, s, current, index, deck);
}

function baseSlide(pptx, s, slide, index, deck, opts = {}) {
  const accent = TYPE_ACCENTS[slide.type] || deck.accent;
  const dark = !!opts.dark;
  s.background = { color: dark ? deck.ink : deck.bg };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: dark ? deck.ink : deck.bg }, line: { transparency: 100 } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.11, fill: { color: accent }, line: { transparency: 100 } });
  s.addText((SLIDE_TYPE_LABELS[slide.type] || 'Clase').toUpperCase(), { x: 0.62, y: 0.4, w: 2.1, h: 0.24, fontSize: 8, bold: true, color: dark ? deck.accent2 : accent, charSpace: 1.2, fontFace: deck.fontFace });
  s.addText(String(index + 1).padStart(2, '0'), { x: 12.05, y: 6.93, w: 0.62, h: 0.24, fontSize: 8.5, bold: true, color: dark ? 'D7DEE8' : '7D8797', align: 'right', fontFace: deck.fontFace });
  return { accent, ink: dark ? 'FFFFFF' : deck.ink, muted: dark ? 'D7DEE8' : '637083', dark };
}

function renderHookSlide(pptx, s, slide, index, deck) {
  const ui = baseSlide(pptx, s, slide, index, deck, { dark: true });
  s.addText(slide.title, { x: 0.72, y: 1.22, w: 7.9, h: 1.22, fontSize: 34, bold: true, color: 'FFFFFF', fontFace: deck.displayFace, fit: 'shrink' });
  s.addText(slide.claim || firstSentence(slide), { x: 0.78, y: 2.72, w: 6.2, h: 1.1, fontSize: 17, color: ui.muted, fontFace: deck.fontFace, fit: 'shrink' });
  renderBulletCards(pptx, s, slide.bullets.slice(0, 3), 0.76, 4.28, 2.55, 1.05, ui.accent, 'FFFFFF', deck.fontFace);
  renderImageOrVisual(pptx, s, slide, { x: 8.3, y: 1.22, w: 3.8, h: 4.72 }, deck, ui.accent, true);
}

function renderObjectiveSlide(pptx, s, slide, index, deck) {
  const ui = baseSlide(pptx, s, slide, index, deck);
  s.addText(slide.title, { x: 0.72, y: 0.92, w: 6.8, h: 0.72, fontSize: 27, bold: true, color: ui.ink, fontFace: deck.displayFace, fit: 'shrink' });
  s.addText(slide.claim || 'Al terminar, los estudiantes podran demostrar lo esencial.', { x: 7.85, y: 0.98, w: 3.8, h: 0.58, fontSize: 13, color: ui.muted, fontFace: deck.fontFace, fit: 'shrink' });
  renderNumberedLanes(pptx, s, slide.bullets.slice(0, 4), 0.84, 2.12, 11.55, 0.88, ui.accent, deck);
}

function renderConceptSlide(pptx, s, slide, index, deck) {
  const ui = baseSlide(pptx, s, slide, index, deck);
  s.addText(slide.title, { x: 0.72, y: 0.92, w: 7.2, h: 0.72, fontSize: 29, bold: true, color: ui.ink, fontFace: deck.displayFace, fit: 'shrink' });
  s.addText(slide.claim || firstSentence(slide), { x: 0.76, y: 1.78, w: 5.4, h: 0.76, fontSize: 14.5, color: ui.muted, fontFace: deck.fontFace, fit: 'shrink' });
  renderBulletList(s, slide.bullets.slice(0, 5), { x: 0.88, y: 3.0, w: 5.35, h: 2.55 }, ui.ink, deck.fontFace, 16);
  renderImageOrVisual(pptx, s, slide, { x: 7.05, y: 1.34, w: 4.75, h: 4.55 }, deck, ui.accent);
}

function renderExampleSlide(pptx, s, slide, index, deck) {
  const ui = baseSlide(pptx, s, slide, index, deck);
  s.addText(slide.title, { x: 0.74, y: 0.86, w: 9.6, h: 0.62, fontSize: 27, bold: true, color: ui.ink, fontFace: deck.displayFace, fit: 'shrink' });
  renderStepStrip(pptx, s, (slide.bullets.length ? slide.bullets : splitBodyLines(slide.body)).slice(0, 4), 0.84, 2.0, 11.6, 3.25, ui.accent, deck);
  s.addText(slide.claim || 'Usa este ejemplo para modelar el razonamiento antes de la practica.', { x: 0.9, y: 5.95, w: 10.6, h: 0.42, fontSize: 12.5, color: ui.muted, fontFace: deck.fontFace, fit: 'shrink' });
}

function renderComparisonSlide(pptx, s, slide, index, deck) {
  const ui = baseSlide(pptx, s, slide, index, deck);
  s.addText(slide.title, { x: 0.74, y: 0.88, w: 10.8, h: 0.66, fontSize: 27, bold: true, color: ui.ink, fontFace: deck.displayFace, fit: 'shrink' });
  const items = slide.bullets.length ? slide.bullets : splitBodyLines(slide.body);
  const left = items.filter((_, i) => i % 2 === 0).slice(0, 4);
  const right = items.filter((_, i) => i % 2 === 1).slice(0, 4);
  renderComparePanel(s, 'Idea A', left, 0.82, 2.0, 5.45, 3.82, ui.accent, deck);
  renderComparePanel(s, 'Idea B', right.length ? right : items.slice(2, 6), 7.05, 2.0, 5.45, 3.82, deck.accent2, deck);
}

function renderProcessSlide(pptx, s, slide, index, deck) {
  const ui = baseSlide(pptx, s, slide, index, deck);
  s.addText(slide.title, { x: 0.74, y: 0.9, w: 9.6, h: 0.64, fontSize: 28, bold: true, color: ui.ink, fontFace: deck.displayFace, fit: 'shrink' });
  renderStepStrip(pptx, s, slide.bullets.slice(0, 5), 0.78, 2.08, 11.85, 3.55, ui.accent, deck);
}

function renderActivitySlide(pptx, s, slide, index, deck) {
  const ui = baseSlide(pptx, s, slide, index, deck);
  s.addShape(pptx.ShapeType.rect, { x: 0.76, y: 1.05, w: 11.75, h: 5.55, fill: { color: 'FFFFFF' }, line: { color: deck.soft, pt: 1 } });
  s.addText(slide.title, { x: 1.08, y: 1.34, w: 7.6, h: 0.66, fontSize: 28, bold: true, color: ui.ink, fontFace: deck.displayFace, fit: 'shrink' });
  s.addText(slide.claim || 'Actividad rapida para convertir la explicacion en evidencia de aprendizaje.', { x: 1.12, y: 2.18, w: 4.8, h: 0.58, fontSize: 13, color: ui.muted, fontFace: deck.fontFace, fit: 'shrink' });
  renderBulletList(s, slide.bullets.slice(0, 5), { x: 6.45, y: 1.55, w: 5.35, h: 4.25 }, deck.ink, deck.fontFace, 15);
  s.addShape(pptx.ShapeType.rect, { x: 1.1, y: 4.78, w: 3.2, h: 0.58, fill: { color: ui.accent }, line: { transparency: 100 } });
  s.addText('Trabajo activo', { x: 1.28, y: 4.96, w: 2.7, h: 0.2, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', fontFace: deck.fontFace });
}

function renderRecapSlide(pptx, s, slide, index, deck) {
  const ui = baseSlide(pptx, s, slide, index, deck);
  s.addText(slide.title, { x: 0.74, y: 0.96, w: 9.6, h: 0.64, fontSize: 29, bold: true, color: ui.ink, fontFace: deck.displayFace, fit: 'shrink' });
  renderBulletCards(pptx, s, slide.bullets.slice(0, 4), 0.82, 2.18, 2.78, 2.45, ui.accent, deck.ink, deck.fontFace);
}

function renderExitSlide(pptx, s, slide, index, deck) {
  const ui = baseSlide(pptx, s, slide, index, deck, { dark: true });
  s.addText(slide.title, { x: 0.78, y: 1.22, w: 8.4, h: 1.02, fontSize: 33, bold: true, color: 'FFFFFF', fontFace: deck.displayFace, fit: 'shrink' });
  s.addText(slide.claim || 'Cierra con una respuesta breve que muestre comprension.', { x: 0.82, y: 2.45, w: 5.7, h: 0.68, fontSize: 15, color: ui.muted, fontFace: deck.fontFace, fit: 'shrink' });
  renderNumberedLanes(pptx, s, slide.bullets.slice(0, 3), 0.9, 3.6, 10.8, 0.86, ui.accent, { ...deck, ink: 'FFFFFF', bg: deck.ink, soft: '344660' });
}

function renderImageOrVisual(pptx, s, slide, box, deck, accent, dark = false) {
  if (slide.imageUrl) {
    try {
      s.addImage({ path: slide.imageUrl, ...box, sizing: { type: 'contain', w: box.w, h: box.h } });
      return;
    } catch {}
  }
  s.addShape(pptx.ShapeType.rect, { ...box, fill: { color: dark ? '26364F' : 'FFFFFF' }, line: { color: dark ? '4C5D78' : deck.soft, pt: 1.2 } });
  s.addShape(pptx.ShapeType.ellipse, { x: box.x + box.w * 0.18, y: box.y + box.h * 0.12, w: box.w * 0.64, h: box.w * 0.64, fill: { color: accent, transparency: 88 }, line: { color: accent, pt: 2, transparency: 10 } });
  s.addShape(pptx.ShapeType.rect, { x: box.x + box.w * 0.22, y: box.y + box.h * 0.63, w: box.w * 0.55, h: 0.12, fill: { color: accent }, line: { transparency: 100 } });
  s.addText(slide.visualIntent || 'Visual de apoyo', { x: box.x + 0.38, y: box.y + box.h - 0.78, w: box.w - 0.76, h: 0.44, fontSize: 10.5, color: dark ? 'D7DEE8' : '657284', align: 'center', fontFace: deck.fontFace, fit: 'shrink' });
}

function renderBulletList(s, bullets, box, color, fontFace, fontSize = 15) {
  const text = (bullets.length ? bullets : ['Idea clave', 'Evidencia o ejemplo', 'Accion del estudiante']).slice(0, 6);
  s.addText(text.map(b => ({ text: b, options: { bullet: { indent: 14 } } })), {
    ...box,
    fontSize,
    color,
    fontFace,
    fit: 'shrink',
    paraSpaceAfterPt: 8,
    valign: 'top',
  });
}

function renderBulletCards(pptx, s, bullets, x, y, w, h, accent, ink, fontFace) {
  const items = (bullets.length ? bullets : ['Conectar', 'Explorar', 'Responder']).slice(0, 4);
  items.forEach((item, i) => {
    const cx = x + i * (w + 0.28);
    s.addShape(pptx.ShapeType.rect, { x: cx, y, w, h, fill: { color: 'FFFFFF', transparency: ink === 'FFFFFF' ? 92 : 0 }, line: { color: accent, transparency: ink === 'FFFFFF' ? 15 : 55, pt: 1.1 } });
    s.addShape(pptx.ShapeType.rect, { x: cx, y, w, h: 0.09, fill: { color: accent }, line: { transparency: 100 } });
    s.addText(item, { x: cx + 0.18, y: y + 0.28, w: w - 0.36, h: h - 0.38, fontSize: 12.5, bold: true, color: ink, fontFace, fit: 'shrink', valign: 'mid' });
  });
}

function renderNumberedLanes(pptx, s, bullets, x, y, w, h, accent, deck) {
  const items = (bullets.length ? bullets : ['Activar conocimiento previo', 'Explicar la idea clave', 'Practicar con evidencia']).slice(0, 5);
  items.forEach((item, i) => {
    const top = y + i * (h + 0.24);
    s.addShape(pptx.ShapeType.rect, { x, y: top, w, h, fill: { color: i % 2 ? deck.soft : 'FFFFFF', transparency: deck.bg === deck.ink ? 88 : 0 }, line: { color: deck.soft, pt: 1 } });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.22, y: top + 0.18, w: 0.38, h: 0.38, fill: { color: accent }, line: { transparency: 100 } });
    s.addText(String(i + 1), { x: x + 0.22, y: top + 0.28, w: 0.38, h: 0.1, fontSize: 7.5, bold: true, color: 'FFFFFF', align: 'center', fontFace: deck.fontFace });
    s.addText(item, { x: x + 0.82, y: top + 0.2, w: w - 1.05, h: h - 0.22, fontSize: 14, color: deck.ink, fontFace: deck.fontFace, fit: 'shrink', valign: 'mid' });
  });
}

function renderStepStrip(pptx, s, bullets, x, y, w, h, accent, deck) {
  const items = (bullets.length ? bullets : ['Observa', 'Piensa', 'Explica']).slice(0, 5);
  const gap = 0.18;
  const cardW = (w - gap * (items.length - 1)) / items.length;
  items.forEach((item, i) => {
    const cx = x + i * (cardW + gap);
    s.addShape(pptx.ShapeType.rect, { x: cx, y, w: cardW, h, fill: { color: i === 0 ? accent : 'FFFFFF' }, line: { color: i === 0 ? accent : deck.soft, pt: 1 } });
    s.addText(String(i + 1).padStart(2, '0'), { x: cx + 0.22, y: y + 0.22, w: 0.68, h: 0.22, fontSize: 9, bold: true, color: i === 0 ? 'FFFFFF' : accent, fontFace: deck.fontFace });
    s.addText(item, { x: cx + 0.24, y: y + 0.82, w: cardW - 0.48, h: h - 1.05, fontSize: 13, bold: i === 0, color: i === 0 ? 'FFFFFF' : deck.ink, fontFace: deck.fontFace, fit: 'shrink', valign: 'mid' });
  });
}

function renderComparePanel(s, label, items, x, y, w, h, accent, deck) {
  s.addShape('rect', { x, y, w, h, fill: { color: 'FFFFFF' }, line: { color: deck.soft, pt: 1 } });
  s.addShape('rect', { x, y, w, h: 0.5, fill: { color: accent }, line: { transparency: 100 } });
  s.addText(label, { x: x + 0.24, y: y + 0.15, w: w - 0.48, h: 0.16, fontSize: 10, bold: true, color: 'FFFFFF', fontFace: deck.fontFace });
  renderBulletList(s, items, { x: x + 0.34, y: y + 0.9, w: w - 0.68, h: h - 1.2 }, deck.ink, deck.fontFace, 13);
}

function firstSentence(slide) {
  const text = [slide.body, ...(slide.bullets || [])].join(' ').replace(/\s+/g, ' ').trim();
  return text.split(/(?<=[.!?])\s+/)[0] || '';
}

function splitBodyLines(body = '') {
  return String(body).split(/\n|[.;]\s+/).map(s => s.trim()).filter(Boolean);
}

function parseMarkdownToSlides(md) {
  const lines = md.split('\n');
  const slides = [];
  let cur = null;
  function flush() {
    if (cur) {
      const image = cur.body.match(/!\[([^\]]*)\]\(([^)\s]+)\)/);
      const link = cur.body.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
      const alignMatch = cur.body.match(/<!-- align:\s*(left|center|right|justify)\s*-->/i);
      const layoutMatch = cur.body.match(/<!-- layout:\s*([\s\S]*?)\s*-->/i);
      const styleMatch = cur.body.match(/<!-- style:\s*([\s\S]*?)\s*-->/i);
      const typeMatch = cur.body.match(/<!-- type:\s*([a-z-]+)\s*-->/i);
      const claimMatch = cur.body.match(/<!-- claim:\s*([\s\S]*?)\s*-->/i);
      const visualMatch = cur.body.match(/<!-- visual:\s*([\s\S]*?)\s*-->/i);
      const notes = cur.body.match(/(?:^|\s)(?:Notas?|Notas del maestro):\s*([\s\S]+)/i);
      
      cur.imageAlt = image?.[1] || '';
      cur.imageUrl = image?.[2] || '';
      cur.linkText = link?.[1] || '';
      cur.linkUrl = link?.[2] || '';
      cur.align = alignMatch?.[1] || 'left';
      cur.layout = parseSlideLayout(layoutMatch?.[1]);
      cur.style = parseSlideStyle(styleMatch?.[1]);
      cur.type = normalizeSlideType(typeMatch?.[1], slides.length);
      cur.claim = claimMatch?.[1]?.trim() || '';
      cur.visualIntent = visualMatch?.[1]?.trim() || '';
      cur.notes = notes?.[1]?.trim() || '';
      
      cur.body = cur.body
        .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1')
        .replace(/<!-- align:\s*(left|center|right|justify)\s*-->/gi, ' ')
        .replace(/<!-- layout:\s*[\s\S]*?\s*-->/gi, ' ')
        .replace(/<!-- style:\s*[\s\S]*?\s*-->/gi, ' ')
        .replace(/<!-- type:\s*[a-z-]+\s*-->/gi, ' ')
        .replace(/<!-- claim:\s*[\s\S]*?\s*-->/gi, ' ')
        .replace(/<!-- visual:\s*[\s\S]*?\s*-->/gi, ' ')
        .replace(/(?:^|\s)(?:Notas?|Notas del maestro):\s*[\s\S]+$/i, ' ')
        .trim();
      cur.bullets = cur.bullets.filter(Boolean);
      slides.push(cur);
    }
    cur = null;
  }
  for (const raw of lines) {
    const line = raw.replace(/\*\*/g, '').replace(/^[#]+\s*/, (m) => m); // keep heading marker
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h1 || h2 || h3) {
      flush();
      const title = stripSlideNumberLabels((h1 || h2 || h3)[1]).replace(/\*\*/g, '').trim();
      cur = { title, bullets: [], body: '', imageAlt: '', imageUrl: '', linkText: '', linkUrl: '', align: 'left', notes: '' };
      continue;
    }
    if (!cur) cur = { title: 'Contenido', bullets: [], body: '', imageAlt: '', imageUrl: '', linkText: '', linkUrl: '', align: 'left', notes: '' };
    const bullet = line.match(/^\s*[-*]\s+(.+)/);
    const num = line.match(/^\s*\d+\.\s+(.+)/);
    if (bullet) cur.bullets.push(bullet[1].replace(/\*\*/g, '').trim());
    else if (num) cur.bullets.push(num[1].replace(/\*\*/g, '').trim());
    else if (line.trim()) cur.body += line.trim() + ' ';
  }
  flush();
  return slides.filter(s => s.title || s.bullets.length || s.body);
}

const SLIDE_CANVAS = { w: 1280, h: 720 };
const PPTX_CANVAS = { w: 13.333, h: 7.5 };
const DEFAULT_SLIDE_LAYOUT = {
  title: { x: 86, y: 66, w: 1110, h: 92 },
  body: { x: 100, y: 178, w: 1080, h: 438 },
  image: { x: 824, y: 278, w: 320, h: 230 },
};
const FONT_OPTIONS = ['Poppins', 'Sora', 'Overlock', 'Georgia', 'Verdana'];
const DEFAULT_SLIDE_STYLE = { fontFace: 'Poppins', bodySize: 18, titleSize: 30 };

function parseSlideLayout(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseSlideStyle(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeSlideLayout(layout = {}) {
  return {
    title: normalizeBox(layout?.title, DEFAULT_SLIDE_LAYOUT.title),
    body: normalizeBox(layout?.body, DEFAULT_SLIDE_LAYOUT.body),
    image: normalizeBox(layout?.image, DEFAULT_SLIDE_LAYOUT.image),
  };
}

function normalizeSlideStyle(style = {}) {
  const bodySize = clampNumber(style?.bodySize, 13, 26, DEFAULT_SLIDE_STYLE.bodySize);
  const titleSize = clampNumber(style?.titleSize, 20, 42, Math.max(bodySize + 10, DEFAULT_SLIDE_STYLE.titleSize));
  const fontFace = FONT_OPTIONS.includes(style?.fontFace) ? style.fontFace : DEFAULT_SLIDE_STYLE.fontFace;
  return { fontFace, bodySize, titleSize };
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

function pxBoxToInches(box) {
  return {
    x: (box.x / SLIDE_CANVAS.w) * PPTX_CANVAS.w,
    y: (box.y / SLIDE_CANVAS.h) * PPTX_CANVAS.h,
    w: (box.w / SLIDE_CANVAS.w) * PPTX_CANVAS.w,
    h: (box.h / SLIDE_CANVAS.h) * PPTX_CANVAS.h,
  };
}

/* ─────────── Worksheet (student-facing PDF) ─────────── */
export function exportWorksheet(markdown, filename = 'worksheet.pdf', title = 'Hoja de trabajo') {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const marginTop = 38;
  let y = marginTop;

  // Header band
  doc.setFillColor(39, 70, 108);
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(sanitizePdfText(title), marginX, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Genial Skills · Hoja de trabajo', marginX, 21);

  // Student info row
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.text('Nombre: ____________________________________', marginX, 34);
  doc.text('Fecha: ___________', pageW - marginX - 50, 34);
  doc.setDrawColor(220);
  doc.line(marginX, 38, pageW - marginX, 38);

  // Content — strip markdown to plaintext, split by lines, convert into questions
  const cleaned = sanitizePdfText(stripEditorMetadata(stripSlideNumberLabels(markdown)))
    .replace(/```[\s\S]*?```/g, '')                 // strip code blocks
    .replace(/\$\$[\s\S]*?\$\$/g, ' [ecuación] ')   // math placeholders
    .replace(/\$([^$\n]+?)\$/g, '$1')               // inline math: keep raw text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')           // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')        // link text only
    .replace(/\*\*([^*]+)\*\*/g, '$1')              // bold
    .replace(/`([^`]+)`/g, '$1')                    // inline code
    .replace(/^>\s+/gm, '')                         // blockquotes
    .replace(/\r/g, '')
    .split('\n');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let questionNum = 0;
  let inAnswerSpace = false;

  for (const raw of cleaned) {
    const line = raw.trim();
    if (!line) { y += 3; continue; }

    if (y > pageH - 24) { doc.addPage(); y = marginTop; }

    // Heading
    const h = line.match(/^(#+)\s+(.+)/);
    if (h) {
      const level = h[1].length;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(level === 1 ? 14 : 12);
      const wrapped = doc.splitTextToSize(sanitizePdfText(h[2]), pageW - 2 * marginX);
      y += 4;
      doc.text(wrapped, marginX, y);
      y += wrapped.length * 6 + 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      inAnswerSpace = false;
      continue;
    }

    // Numbered question
    const num = line.match(/^\d+\.\s+(.+)/);
    const bullet = line.match(/^[-*]\s+(.+)/);
    let text = sanitizePdfText(num ? num[1] : bullet ? bullet[1] : line);
    if (num || bullet) questionNum++;
    const prefix = (num || bullet) ? `${questionNum}.  ` : '';

    const wrapped = doc.splitTextToSize(sanitizePdfText(prefix + text), pageW - 2 * marginX);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 5.6;

    // After each question, leave 3 ruled lines for the student's answer
    if (num || bullet) {
      for (let k = 0; k < 3; k++) {
        y += 7;
        if (y > pageH - 18) { doc.addPage(); y = marginTop; }
        doc.setDrawColor(200);
        doc.line(marginX + 10, y, pageW - marginX, y);
      }
      y += 6;
    } else {
      y += 1;
    }
  }

  // Footer page numbers
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(`Página ${i} de ${total}`, pageW / 2, pageH - 8, { align: 'center' });
  }

  doc.save(filename);
}
