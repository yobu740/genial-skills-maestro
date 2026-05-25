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

function recursiveSource(subject, folder, grade, gradeFolder, filePattern, parser = 'unit-pdf') {
  return {
    subject,
    grade,
    dir: path.join(ROOT, 'mapas curriculares', folder, gradeFolder),
    filePattern,
    recursive: true,
    parser,
  };
}

function socialStudiesSource(grade) {
  return {
    subject: 'Estudios Sociales',
    grade,
    dir: path.join(ROOT, 'mapas curriculares', 'mapa curricular estudios sociales', `${grade} GRADO`),
    filePattern: new RegExp(`^${grade}\\..*Bosquejo.*\\.pdf$`, 'i'),
    parser: 'social-studies-outline',
  };
}

const SOURCES = [
  ...Array.from({ length: 8 }, (_, index) => gradeSource('Ciencias', 'mapa curricular ciencias', index + 1)),
  ...Array.from({ length: 8 }, (_, index) => gradeSource('Matemáticas', 'mapa curricular matematicas', index + 1)),
  ...Array.from({ length: 9 }, (_, index) => recursiveSource('Español', 'mapa curricular espanol', index + 4, `${index + 4} GRADO`, /^.*Unidad \d+\.\d+.*\.pdf$/i)),
  ...[1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => recursiveSource('Inglés', 'mapa curricular ingles', grade, `${grade} GRADE`, /^Unit \d+\.\d+.*\.pdf$/i, 'english-unit-pdf')),
  recursiveSource('Inglés', 'mapa curricular ingles', 'K', 'KINDERGARTHEN', /^Unit K\.\d+.*\.pdf$/i, 'english-unit-pdf'),
  ...Array.from({ length: 8 }, (_, index) => socialStudiesSource(index + 4)),
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
    .replace(/(?:Unidad|Unit)\s+[K\d]+\.\d+\s*:?.*?(?:Ciencias\s+\d+|Matem[aá]ticas|Español|English as a Second Language|Segundo grado)\s+\d+\s+(?:semanas|weeks) de? ?instrucci[óo]n?\s+p[áa]g(?:ina|e)\s+\d+\s+(?:of|de)\s+\d+/gi, '')
    .replace(/p[áa]gina\s+\d+\s+(?:of|de)\s+\d+/gi, '')
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
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
  const block = sliceBetween(text, /Preguntas Esenciales|Essential Questions/i, /Objetivos de Transferencia|Transfer \(T\) and Acquisition \(A\) Goals/i);
  const normalized = block.replace(/\n+/g, ' ');
  const items = [];
  const regex = /(?:PE|EQ)(\d+)\.?\s*(.*?)(?=\s+(?:CD|EU)\1\.?)\s+(?:CD|EU)\1\.?\s*(.*?)(?=\s+(?:PE|EQ)\d+\.?|$)/g;
  for (const match of normalized.matchAll(regex)) {
    items.push({
      question: cleanExtracted(match[2]),
      understanding: cleanExtracted(match[3]),
    });
  }
  return items;
}

function extractObjectives(text) {
  const block = sliceBetween(text, /Objetivos de Transferencia|Transfer \(T\) and Acquisition \(A\) Goals/i, /Los est[áa]ndares de Puerto Rico|Los Est[áa]ndares de Puerto Rico|Puerto Rico Core Standards/i);
  const normalized = block.replace(/\n+/g, ' ');
  const transferObjectives = [];
  const acquisitionObjectives = [];

  const transfer = normalized.match(/T\d+\.\s*(.*?)(?=El estudiante adquiere destrezas para|The student acquires skills to|A\d+\.|$)/i);
  if (transfer) transferObjectives.push(cleanExtracted(transfer[1]));

  const acquisitionRegex = /A\d+\.\s*(.*?)(?=\s+A\d+\.|$)/g;
  const acquisitionBlock = normalized.replace(/^.*?(El estudiante adquiere destrezas para|The student acquires skills to)\s*\.{0,4}/i, '');
  for (const match of acquisitionBlock.matchAll(acquisitionRegex)) {
    const objective = cleanExtracted(match[1]);
    if (objective) acquisitionObjectives.push(objective);
  }

  return { transferObjectives, acquisitionObjectives };
}

function extractStandards(text) {
  const block = sliceBetween(text, /Los est[áa]ndares de Puerto Rico \(PRCS\)|Los Est[áa]ndares de Puerto Rico \(PRCS\)|Puerto Rico Core Standards \(PRCS\)/i, /ETAPA 1\s+[-–]|STAGE 1\s+[-–]/i);
  const normalized = block.replace(/\n+/g, ' ');
  const standards = [];
  const code = '[K\\d]+\\.[A-ZÁÉÍÓÚÑ]{1,4}\\d*(?:\\.\\d+)+[a-z]?';
  const regex = new RegExp(`(${code})\\s+(.*?)(?=\\s+${code}\\s+|$)`, 'g');
  for (const match of normalized.matchAll(regex)) {
    const description = cleanExtracted(match[2]).replace(/\s+Unidad\s+\d+\.\d+.*$/i, '').trim();
    if (description) standards.push({ code: match[1], description });
  }
  return standards;
}

function parseUnit(text, filename, source) {
  const normalized = cleanText(text);
  const code = normalized.match(/(?:Unidad|Unit)\s+([K\d]+\.\d+)/i)?.[1] || filename.match(/([K\d]+\.\d+)/i)?.[1] || '';
  const weeks = Number(normalized.match(/(\d+)\s+(?:semanas|weeks)\s+(?:de\s+)?instrucci[óo]n/i)?.[1]) || null;
  const titleHeader = normalized.match(/(?:Unidad|Unit)\s+[K\d]+\.\d+\s*:?\s*([\s\S]*?)(?:\n\s*(?:Ciencias\s+\d+|Matem[aá]ticas|Español|English as a Second Language|Segundo grado)\s*\n)/i);
  const title = cleanInline(titleHeader?.[1] || `Unidad ${code}`);
  const summary = stripSectionHeading(
    sliceBetween(normalized, /Resumen de\s+la\s+u\s*nidad|Resumen de\s+la\s+U\s*nidad/i, /Temas\s+t\s*ransve\s*r\s*sa\s*les|Temas\s+T\s*ransversales/i),
    /Resumen de\s+la\s+u\s*nidad|Resumen de\s+la\s+U\s*nidad/i,
  );
  const themes = extractListBetween(normalized, /Temas\s+t\s*ransve\s*r\s*sa\s*les|Temas\s+T\s*ransversales/i, /Temas\s+g\s*eneradores|Temas\s+G\s*eneradores|Comentario o pregunta/i);
  const generatorThemes = extractListBetween(normalized, /Temas\s+g\s*eneradores|Temas\s+G\s*eneradores/i, /Comentario o pregunta/i);
  const { transferObjectives, acquisitionObjectives } = extractObjectives(normalized);

  return {
    id: `${subjectPrefix(source.subject)}_${String(code).replace('.', '_')}`,
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

function subjectPrefix(subject) {
  if (subject === 'Ciencias') return 'SCI';
  if (subject === 'Matemáticas') return 'MAT';
  if (subject === 'Español') return 'ESP';
  if (subject === 'Inglés') return 'ING';
  if (subject === 'Estudios Sociales') return 'SOC';
  return 'CUR';
}

function parseSocialStudiesOutline(text, filename, source) {
  const normalized = cleanText(text).replace(/\n+/g, ' ');
  const unitRegex = new RegExp(`\\b(${source.grade}\\.\\d+)\\s+([A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑ0-9\\s,¿?¡!:;\\-]*?)?(?=\\s+Temas transversales)`, 'g');
  const matches = [...normalized.matchAll(unitRegex)];
  return matches.map((match, index) => {
    const code = match[1];
    const nextIndex = matches[index + 1]?.index ?? normalized.length;
    const chunk = normalized.slice(match.index, nextIndex);
    const title = cleanInline(match[2] || `Unidad ${code}`).replace(/\s+/g, ' ');
    const weeks = Number(chunk.match(/Cantidad de semanas:\s*(\d+)/i)?.[1]) || null;
    const standards = [...new Set((chunk.match(new RegExp(`${source.grade}\\.[A-Z]{1,4}\\.?\\d*\\.\\d+`, 'g')) || []))]
      .map(indicator => ({ code: indicator, description: '' }));
    const content = cleanInline((chunk.match(/Contenido\s+Cantidad de semanas:\s*\d+\s+Indicadores\s+(.*?)(?=\s+\d+\.[A-Z]{1,4}|$)/i)?.[1] || '').slice(0, 1200));
    return {
      id: `SOC_${String(code).replace('.', '_')}`,
      code,
      subject: source.subject,
      grade: source.grade,
      title,
      weeks,
      summary: content,
      transferObjectives: [],
      acquisitionObjectives: [],
      essentialQuestions: [],
      standards,
      themes: [],
      generatorThemes: [],
      vocabulary: [],
      performanceTasks: [],
      otherEvidence: [],
      learningActivities: [],
      sourceFiles: [{ type: 'curriculum_outline', filename }],
      source: 'generated-local',
    };
  });
}

async function listSourceFiles(source) {
  let names = [];
  try {
    names = await fs.readdir(source.dir);
  } catch {
    return [];
  }
  const matched = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && source.recursive) await walk(fullPath);
      if (entry.isFile() && source.filePattern.test(entry.name)) matched.push(path.relative(source.dir, fullPath));
    }
  }
  await walk(source.dir);
  return matched.sort((a, b) => a.localeCompare(b));
}

await fs.mkdir(path.dirname(OUT), { recursive: true });

const units = [];
for (const source of SOURCES) {
  const files = await listSourceFiles(source);
  for (const filename of files) {
    const filePath = path.join(source.dir, filename);
    const data = await pdf(await fs.readFile(filePath));
    const parsedUnits = source.parser === 'social-studies-outline'
      ? parseSocialStudiesOutline(data.text, filename, source)
      : [parseUnit(data.text, filename, source)];
    for (const unit of parsedUnits) {
      if (!unit.code) continue;
      if (unit.standards.length === 0 && source.subject === 'Inglés') continue;
      units.push(unit);
      console.log(`${source.subject} ${source.grade} U${unit.code} ${unit.title} (${data.numpages} pages): ${unit.standards.length} standards`);
    }
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
