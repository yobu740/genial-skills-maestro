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
  return sanitizePdfText(latexToReadable(stripSlideNumberLabels(markdown)))
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

  // Cover slide
  const cover = pptx.addSlide();
  cover.background = { color: NAVY };
  cover.addText(title, {
    x: 0.5, y: 2.5, w: 12, h: 1.5,
    fontSize: 40, bold: true, color: 'FFFFFF', fontFace: 'Poppins',
  });
  cover.addText('Generado con Genial Skills · IA Educativa', {
    x: 0.5, y: 4.2, w: 12, h: 0.6,
    fontSize: 16, color: TEAL.replace('#', ''), fontFace: 'Poppins',
  });

  const slides = parseMarkdownToSlides(markdown);
  for (const slide of slides) {
    const s = pptx.addSlide();
    s.background = { color: 'F7F9FC' };
    const layout = normalizeSlideLayout(slide.layout);

    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.18, fill: { color: NAVY } });
    s.addShape(pptx.ShapeType.rect, { x: 0.46, y: 0.58, w: 0.07, h: 5.95, fill: { color: TEAL } });
    s.addShape(pptx.ShapeType.rect, {
      x: 0.82, y: 6.85, w: 11.7, h: 0.03,
      fill: { color: 'DDE5F0' },
      line: { transparency: 100 },
    });

    s.addText(slide.title, {
      ...pxBoxToInches(layout.title),
      fontSize: 28, bold: true, color: NAVY.replace('#', ''), fontFace: 'Poppins',
      align: slide.align || 'left',
      valign: 'mid',
      fit: 'shrink',
    });

    const textOptions = {
      ...pxBoxToInches(layout.body),
      fontSize: slide.bullets.length > 7 ? 15 : 16,
      color: '1A2740',
      fontFace: 'Poppins',
      paraSpaceAfterPt: 7,
      fit: 'shrink',
      align: slide.align || 'left',
      valign: 'top',
    };

    if (slide.bullets.length) {
      s.addText(
        slide.bullets.slice(0, 9).map(b => ({ text: b, options: { bullet: { indent: 18 } } })),
        textOptions
      );
    } else if (slide.body) {
      s.addText(slide.body, {
        ...textOptions,
        fontSize: 16,
      });
    }

    if (slide.imageUrl) {
      const imageBox = pxBoxToInches(layout.image);
      try {
        s.addImage({
          path: slide.imageUrl,
          ...imageBox,
          sizing: { type: 'contain', w: imageBox.w, h: imageBox.h }
        });
      } catch {
        s.addText(slide.imageAlt || 'Imagen', {
          x: imageBox.x, y: imageBox.y, w: imageBox.w, h: 0.35,
          fontSize: 11, color: TEAL.replace('#', ''), fontFace: 'Poppins',
          align: 'center',
        });
      }
    }

    if (slide.linkUrl) {
      s.addText(slide.linkText || slide.linkUrl, {
        x: 0.84, y: 6.56, w: 7.4, h: 0.35,
        fontSize: 12,
        color: TEAL.replace('#', ''),
        fontFace: 'Poppins',
        hyperlink: { url: slide.linkUrl },
      });
    }
    if (slide.notes) s.addNotes(slide.notes);
    s.addText('Genial Skills', {
      x: 0.84, y: 7.08, w: 11.7, h: 0.3,
      fontSize: 10, color: '8B97AC', fontFace: 'Poppins', align: 'right',
    });
  }

  return pptx.writeFile({ fileName: filename });
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
      const notes = cur.body.match(/(?:^|\s)(?:Notas?|Notas del maestro):\s*([\s\S]+)/i);
      
      cur.imageAlt = image?.[1] || '';
      cur.imageUrl = image?.[2] || '';
      cur.linkText = link?.[1] || '';
      cur.linkUrl = link?.[2] || '';
      cur.align = alignMatch?.[1] || 'left';
      cur.layout = parseSlideLayout(layoutMatch?.[1]);
      cur.notes = notes?.[1]?.trim() || '';
      
      cur.body = cur.body
        .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1')
        .replace(/<!-- align:\s*(left|center|right|justify)\s*-->/gi, ' ')
        .replace(/<!-- layout:\s*[\s\S]*?\s*-->/gi, ' ')
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

function parseSlideLayout(raw) {
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
  const cleaned = sanitizePdfText(stripSlideNumberLabels(markdown))
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
