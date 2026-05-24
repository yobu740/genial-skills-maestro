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

  // Split markdown by H1/H2 headings — each heading starts a new slide
  const slides = parseMarkdownToSlides(markdown);
  for (const slide of slides) {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.5, fill: { color: NAVY } });
    s.addText(slide.title, {
      x: 0.4, y: 0.65, w: 12.5, h: 0.8,
      fontSize: 26, bold: true, color: NAVY.replace('#', ''), fontFace: 'Poppins',
    });
    if (slide.bullets.length) {
      s.addText(
        slide.bullets.map(b => ({ text: b, options: { bullet: true } })),
        {
          x: 0.5, y: 1.6, w: 12.3, h: 5.5,
          fontSize: 18, color: '1A2740', fontFace: 'Poppins', lineSpacing: 32,
        }
      );
    } else if (slide.body) {
      s.addText(slide.body, {
        x: 0.5, y: 1.6, w: 12.3, h: 5.5,
        fontSize: 16, color: '1A2740', fontFace: 'Poppins',
      });
    }
    s.addText('Genial Skills', {
      x: 0.5, y: 7.1, w: 12.3, h: 0.3,
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
      cur.bullets = cur.bullets.filter(Boolean);
      cur.body = cur.body.trim();
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
      const title = (h1 || h2 || h3)[1].replace(/\*\*/g, '').trim();
      cur = { title, bullets: [], body: '' };
      continue;
    }
    if (!cur) cur = { title: 'Contenido', bullets: [], body: '' };
    const bullet = line.match(/^\s*[-*]\s+(.+)/);
    const num = line.match(/^\s*\d+\.\s+(.+)/);
    if (bullet) cur.bullets.push(bullet[1].replace(/\*\*/g, '').trim());
    else if (num) cur.bullets.push(num[1].replace(/\*\*/g, '').trim());
    else if (line.trim()) cur.body += line.trim() + ' ';
  }
  flush();
  // Drop empty slides
  return slides.filter(s => s.title || s.bullets.length || s.body);
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
  doc.text(title, marginX, 14);
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
  const cleaned = markdown
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
      const wrapped = doc.splitTextToSize(h[2], pageW - 2 * marginX);
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
    let text = num ? num[1] : bullet ? bullet[1] : line;
    if (num || bullet) questionNum++;
    const prefix = (num || bullet) ? `${questionNum}.  ` : '';

    const wrapped = doc.splitTextToSize(prefix + text, pageW - 2 * marginX);
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
