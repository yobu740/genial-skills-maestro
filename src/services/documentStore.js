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

function sortDocs(docs) {
  return [...docs].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

function writeAll(docs) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortDocs(docs)));
  window.dispatchEvent(new CustomEvent('genial-documents-changed', { detail: docs }));
}

function isNewer(a, b) {
  return new Date(a?.updatedAt || a?.createdAt || 0) > new Date(b?.updatedAt || b?.createdAt || 0);
}

function mergeDocuments(localDocs, cloudDocs) {
  const byId = new Map();
  for (const doc of cloudDocs || []) byId.set(doc.id, doc);
  for (const doc of localDocs || []) {
    const existing = byId.get(doc.id);
    if (!existing || isNewer(doc, existing)) byId.set(doc.id, doc);
  }
  return sortDocs([...byId.values()]);
}

async function upsertCloudDocument(doc) {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).document;
}

export function listDocuments() {
  return sortDocs(readAll());
}

export async function syncDocumentsWithCloud() {
  const localDocs = readAll();
  try {
    const res = await fetch('/api/documents');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.source && data.source !== 'supabase') {
      return { documents: sortDocs(localDocs), source: data.source, warning: data.warning || '' };
    }

    const cloudDocs = Array.isArray(data.documents) ? data.documents : [];
    const merged = mergeDocuments(localDocs, cloudDocs);
    writeAll(merged);

    const cloudById = new Map(cloudDocs.map(doc => [doc.id, doc]));
    const toUpload = merged.filter(doc => {
      const cloud = cloudById.get(doc.id);
      return !cloud || isNewer(doc, cloud);
    });
    await Promise.allSettled(toUpload.map(upsertCloudDocument));

    return { documents: listDocuments(), source: 'supabase', warning: '' };
  } catch (error) {
    return { documents: sortDocs(localDocs), source: 'local', warning: String(error?.message || error) };
  }
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
  upsertCloudDocument(doc).catch(() => {});
  return doc;
}

export function deleteDocument(id) {
  writeAll(readAll().filter((doc) => doc.id !== id));
  fetch(`/api/documents/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
}

export function updateDocument(id, patch) {
  let updated = null;
  const docs = readAll().map((doc) => {
    if (doc.id !== id) return doc;
    updated = { ...doc, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  writeAll(docs);
  if (updated) {
    fetch(`/api/documents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});
  }
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
