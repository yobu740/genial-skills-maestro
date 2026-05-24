const STORAGE_KEY = 'genial.skills.documents.v1';

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readAll() {
  if (typeof window === 'undefined') return [];
  const docs = safeParse(window.localStorage.getItem(STORAGE_KEY), []);
  return Array.isArray(docs) ? docs : [];
}

function writeAll(docs) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  window.dispatchEvent(new CustomEvent('genial-documents-changed', { detail: docs }));
}

export function listDocuments() {
  return readAll().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

export function saveGeneratedDocument({
  title,
  toolTitle,
  category,
  model,
  content,
  prompt,
  values,
  kind = 'markdown',
}) {
  const cleanContent = String(content || '').trim();
  if (!cleanContent) return null;

  const now = new Date().toISOString();
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const doc = {
    id,
    title: title || toolTitle || 'Documento IA',
    toolTitle: toolTitle || title || 'Herramienta IA',
    category: category || 'ia',
    kind,
    model: model || '',
    content: cleanContent,
    prompt: prompt || '',
    values: values || {},
    createdAt: now,
    updatedAt: now,
  };

  writeAll([doc, ...readAll()]);
  return doc;
}

export function deleteDocument(id) {
  writeAll(readAll().filter((doc) => doc.id !== id));
}

export function updateDocument(id, patch) {
  let updated = null;
  const docs = readAll().map((doc) => {
    if (doc.id !== id) return doc;
    updated = { ...doc, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  writeAll(docs);
  return updated;
}

export function exportDocumentMarkdown(doc) {
  const stamp = new Date(doc.createdAt || Date.now()).toLocaleString();
  return [
    `# ${doc.title || 'Documento IA'}`,
    '',
    `Herramienta: ${doc.toolTitle || 'IA'}`,
    doc.model ? `Modelo: ${doc.model}` : null,
    `Fecha: ${stamp}`,
    '',
    doc.content || '',
  ].filter(Boolean).join('\n');
}
