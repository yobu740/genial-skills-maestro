import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'data', 'curriculum-units.generated.json');

function gradeSource(subject, folder, grade) {
  return {
    subject,
    grade,
    dir: path.join(ROOT, 'mapas curriculares', folder, `${grade} GRADO`),
    filePattern: new RegExp(`(?:Unidad[_ ]?|VO\\.|^).*${grade}\\.\\d+.*\\.pdf$`, 'i'),
  };
}

const SOURCES = [
  ...Array.from({ length: 8 }, (_, index) => gradeSource('Ciencias', 'mapa curricular ciencias', index + 1)),
  ...Array.from({ length: 8 }, (_, index) => gradeSource('Matemáticas', 'mapa curricular matematicas', index + 1)),
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
    .replace(/Unidad\s+\d+\.\d+\s*:?.*?(?:Ciencias\s+\d+|Matem[aá]ticas|Segundo grado)\s+\d+\s+semanas de instrucci[óo]n\s+p[áa]gina\s+\d+\s+(?:of|de)\s+\d+/gi, '')
    .replace(/p[áa]gina\s+\d+\s+(?:of|de)\s+\d+/gi, '')
    .trim();
}

function cleanInline(value = '') {
  return cleanExtracted(value).replace(/\s+/g, ' ').trim();
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
  const regex = /PE(\d+)\.?\s*(.*?)(?=\s+CD\1\.?)\s+CD\1\.?\s*(.*?)(?=\s+PE\d+\.?|$)/g;
  for (const match of normalized.matchAll(regex)) {
    items.push({
      question: cleanExtracted(match[2]),
      understanding: cleanExtracted(match[3]),
    });
  }
  return items;
}

function extractObjectives(text) {
  const block = sliceBetween(text, /Objetivos de Transferencia/i, /Los est[áa]ndares de Puerto Rico|Los Est[áa]ndares de Puerto Rico/i);
  const normalized = block.replace(/\n+/g, ' ');
  const transferObjectives = [];
  const acquisitionObjectives = [];

  const transfer = normalized.match(/T\d+\.\s*(.*?)(?=El estudiante adquiere destrezas para|A\d+\.|$)/i);
  if (transfer) transferObjectives.push(cleanExtracted(transfer[1]));

  const acquisitionRegex = /A\d+\.\s*(.*?)(?=\s+A\d+\.|$)/g;
  const acquisitionBlock = normalized.replace(/^.*?El estudiante adquiere destrezas para\.\.\./i, '');
  for (const match of acquisitionBlock.matchAll(acquisitionRegex)) {
    const objective = cleanExtracted(match[1]);
    if (objective) acquisitionObjectives.push(objective);
  }

  return { transferObjectives, acquisitionObjectives };
}

function extractStandards(text) {
  const block = sliceBetween(text, /Los est[áa]ndares de Puerto Rico \(PRCS\)|Los Est[áa]ndares de Puerto Rico \(PRCS\)/i, /ETAPA 1\s+[-–]/i);
  const normalized = block.replace(/\n+/g, ' ');
  const standards = [];
  const code = '\\d+\\.[A-ZÁÉÍÓÚÑ]{1,4}\\d*(?:\\.\\d+)+';
  const regex = new RegExp(`(${code})\\s+(.*?)(?=\\s+${code}\\s+|$)`, 'g');
  for (const match of normalized.matchAll(regex)) {
    const description = cleanExtracted(match[2]).replace(/\s+Unidad\s+\d+\.\d+.*$/i, '').trim();
    if (description) standards.push({ code: match[1], description });
  }
  return standards;
}

function parseUnit(text, filename, source) {
  const normalized = cleanText(text);
  const code = normalized.match(/Unidad\s+(\d+\.\d+)/i)?.[1] || filename.match(/(\d+\.\d+)/)?.[1] || '';
  const weeks = Number(normalized.match(/(\d+)\s+semanas de instrucci[óo]n/i)?.[1]) || null;
  const titleHeader = normalized.match(/Unidad\s+\d+\.\d+\s*:?\s*([\s\S]*?)(?:\n\s*(?:Ciencias\s+\d+|Matem[aá]ticas|Segundo grado)\s*\n)/i);
  const title = cleanInline(titleHeader?.[1] || `Unidad ${code}`);
  const summary = stripSectionHeading(
    sliceBetween(normalized, /Resumen de\s+la\s+u\s*nidad|Resumen de\s+la\s+U\s*nidad/i, /Temas\s+t\s*ransve\s*r\s*sa\s*les|Temas\s+T\s*ransversales/i),
    /Resumen de\s+la\s+u\s*nidad|Resumen de\s+la\s+U\s*nidad/i,
  );
  const themes = extractListBetween(normalized, /Temas\s+t\s*ransve\s*r\s*sa\s*les|Temas\s+T\s*ransversales/i, /Temas\s+g\s*eneradores|Temas\s+G\s*eneradores|Comentario o pregunta/i);
  const generatorThemes = extractListBetween(normalized, /Temas\s+g\s*eneradores|Temas\s+G\s*eneradores/i, /Comentario o pregunta/i);
  const { transferObjectives, acquisitionObjectives } = extractObjectives(normalized);

  return {
    id: `${source.subject === 'Ciencias' ? 'SCI' : 'MAT'}_${code.replace('.', '_')}`,
    code,
    subject: source.subject,
    grade: source.grade,
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

async function listSourceFiles(source) {
  let names = [];
  try {
    names = await fs.readdir(source.dir);
  } catch {
    return [];
  }
  return names.filter(name => source.filePattern.test(name)).sort((a, b) => a.localeCompare(b));
}

await fs.mkdir(path.dirname(OUT), { recursive: true });

const units = [];
for (const source of SOURCES) {
  const files = await listSourceFiles(source);
  for (const filename of files) {
    const filePath = path.join(source.dir, filename);
    const data = await pdf(await fs.readFile(filePath));
    const unit = parseUnit(data.text, filename, source);
    if (!unit.code) continue;
    units.push(unit);
    console.log(`${source.subject} ${source.grade} U${unit.code} ${unit.title} (${data.numpages} pages): ${unit.standards.length} standards`);
  }
}

units.sort((a, b) =>
  a.subject.localeCompare(b.subject) ||
  Number(a.grade) - Number(b.grade) ||
  Number(a.code) - Number(b.code)
);

const payload = {
  generatedAt: new Date().toISOString(),
  units,
};

await fs.writeFile(OUT, JSON.stringify(payload, null, 2), 'utf8');
console.log(`Wrote ${path.relative(ROOT, OUT)} with ${units.length} units`);
