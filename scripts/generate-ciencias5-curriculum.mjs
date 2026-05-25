import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'mapas curriculares', 'mapa curricular ciencias', '5 GRADO');
const OUT = path.join(ROOT, 'public', 'data', 'curriculum-units.generated.json');

const FILES = [
  'VO.5.1_Ciencias_FINAL.pdf',
  'VO.5.2_Ciencias_FINAL.pdf',
  'VO.5.3_Ciencias_FINAL.pdf',
  'VO.5.4_Ciencias_FINAL.pdf',
  'VO.5.5_Ciencias_FINAL.pdf',
  'VO.5.6_Ciencias_FINAL.pdf',
];

function cleanText(value = '') {
  return String(value)
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanExtracted(value = '') {
  return cleanText(value)
    .replace(/Unidad\s+5\.\d+\s+.*?Ciencias\s+5\s+\d+\s+semanas de instrucci[óo]n\s+p[áa]gina\s+\d+\s+of\s+\d+/gi, '')
    .replace(/p[áa]gina\s+\d+\s+of\s+\d+/gi, '')
    .trim();
}

function firstMatch(text, regex, fallback = '') {
  const match = text.match(regex);
  return match ? cleanText(match[1]) : fallback;
}

function sliceBetween(text, startRegex, endRegex) {
  const start = text.search(startRegex);
  if (start < 0) return '';
  const after = text.slice(start);
  const end = after.search(endRegex);
  return cleanText(end > 0 ? after.slice(0, end) : after);
}

function stripSectionHeading(text, headingRegex) {
  return cleanText(text.replace(headingRegex, ''));
}

function splitLooseLines(text) {
  return cleanText(text)
    .split(/\n+/)
    .map(line => cleanText(line))
    .filter(Boolean);
}

function extractListBetween(text, startRegex, endRegex) {
  const block = sliceBetween(text, startRegex, endRegex);
  return splitLooseLines(stripSectionHeading(block, startRegex))
    .map(line => line.replace(/^[-•]\s*/, '').trim())
    .filter(line => line && !/^Unidad\s+\d/i.test(line));
}

function extractEssentialQuestions(text) {
  const block = sliceBetween(text, /Preguntas Esenciales/i, /Objetivos de Transferencia/i);
  const normalized = block.replace(/\n+/g, ' ');
  const items = [];
  const regex = /PE(\d+)\.\s*(.*?)(?=\s+CD\1\.)\s+CD\1\.\s*(.*?)(?=\s+PE\d+\.|$)/g;
  for (const match of normalized.matchAll(regex)) {
    items.push({
      question: cleanText(match[2]),
      understanding: cleanText(match[3]),
    });
  }
  return items;
}

function extractObjectives(text) {
  const block = sliceBetween(text, /Objetivos de Transferencia/i, /Los Est[áa]ndares de Puerto Rico/i);
  const normalized = block.replace(/\n+/g, ' ');
  const transferObjectives = [];
  const acquisitionObjectives = [];

  const transfer = normalized.match(/T\d+\.\s*(.*?)(?=El estudiante adquiere destrezas para|A\d+\.|$)/i);
  if (transfer) transferObjectives.push(cleanExtracted(transfer[1]));

  const acquisitionRegex = /A\d+\.\s*(.*?)(?=\s+A\d+\.|$)/g;
  const acquisitionBlock = normalized.replace(/^.*?El estudiante adquiere destrezas para\.\.\./i, '');
  for (const match of acquisitionBlock.matchAll(acquisitionRegex)) {
    acquisitionObjectives.push(cleanExtracted(match[1]));
  }

  return { transferObjectives, acquisitionObjectives };
}

function extractStandards(text) {
  const block = sliceBetween(text, /Los Est[áa]ndares de Puerto Rico \(PRCS\)/i, /ETAPA 1\s+[-–]/i);
  const normalized = block.replace(/\n+/g, ' ');
  const standards = [];
  const regex = /(5\.[A-Z]{1,3}\d+(?:\.\d+)?)\s+(.*?)(?=\s+5\.[A-Z]{1,3}\d+(?:\.\d+)?\s+|$)/g;
  for (const match of normalized.matchAll(regex)) {
    const description = cleanExtracted(match[2]).replace(/\s+Unidad\s+5\.\d+.*$/i, '').trim();
    if (description) standards.push({ code: match[1], description });
  }
  return standards;
}

function extractBulletsNear(text, label, max = 10) {
  const idx = text.search(new RegExp(label, 'i'));
  if (idx < 0) return [];
  const snippet = text.slice(idx, idx + 3500);
  const bullets = [];
  for (const line of splitLooseLines(snippet)) {
    if (/^•\s+/.test(line)) {
      const item = cleanText(line.replace(/^•\s+/, ''));
      if (item.length > 5 && item.length < 220) bullets.push(item);
    }
    if (bullets.length >= max) break;
  }
  return bullets;
}

function parseUnit(text, filename) {
  const normalized = cleanText(text);
  const header = normalized.match(/Unidad\s+(5\.\d+)\s+([\s\S]*?)\s+Ciencias\s+5\s+(\d+)\s+semanas de instrucci[óo]n/i);
  const code = header?.[1] || filename.match(/VO\.(5\.\d+)/)?.[1] || '';
  const title = cleanText(header?.[2] || `Unidad ${code}`);
  const weeks = header ? Number(header[3]) : null;
  const summary = stripSectionHeading(
    sliceBetween(normalized, /Resumen\s+de\s+la\s+U\s*nidad/i, /Temas\s+T\s*ransversales/i),
    /Resumen\s+de\s+la\s+U\s*nidad/i,
  );
  const themes = extractListBetween(normalized, /Temas\s+T\s*ransversales/i, /Temas\s+G\s*eneradores|Comentario o pregunta/i);
  const generatorThemes = extractListBetween(normalized, /Temas\s+G\s*eneradores/i, /Comentario o pregunta/i);
  const { transferObjectives, acquisitionObjectives } = extractObjectives(normalized);

  return {
    id: `SCI_${code.replace('.', '_')}`,
    code,
    subject: 'Ciencias',
    grade: 5,
    title,
    weeks,
    summary: cleanExtracted(summary),
    transferObjectives,
    acquisitionObjectives,
    essentialQuestions: extractEssentialQuestions(normalized),
    standards: extractStandards(normalized),
    themes,
    generatorThemes,
    vocabulary: [],
    performanceTasks: [],
    otherEvidence: [],
    learningActivities: [],
    sourceFiles: [{ type: 'curriculum_map', filename }],
    source: 'generated-local',
  };
}

await fs.mkdir(path.dirname(OUT), { recursive: true });

const units = [];
for (const filename of FILES) {
  const filePath = path.join(SRC, filename);
  const data = await pdf(await fs.readFile(filePath));
  const unit = parseUnit(data.text, filename);
  units.push(unit);
  console.log(`${unit.code} ${unit.title} (${data.numpages} pages): ${unit.standards.length} standards`);
}

const payload = {
  generatedAt: new Date().toISOString(),
  subject: 'Ciencias',
  grade: 5,
  units,
};

await fs.writeFile(OUT, JSON.stringify(payload, null, 2), 'utf8');
console.log(`Wrote ${path.relative(ROOT, OUT)} with ${units.length} units`);
