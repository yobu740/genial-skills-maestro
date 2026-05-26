import React from 'react';
import Ic from '../components/Icons.jsx';
import {
  deleteDocument,
  listDocuments,
  updateDocument,
} from '../services/documentStore.js';
import { exportMarkdownPDF, exportPPTX, exportWorksheet } from '../components/exporters.js';

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-PR', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function MyDocuments() {
  const [docs, setDocs] = React.useState(() => listDocuments());
  const [query, setQuery] = React.useState('');
  const [activeId, setActiveId] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [exporting, setExporting] = React.useState('');

  React.useEffect(() => {
    const refresh = () => setDocs(listDocuments());
    window.addEventListener('genial-documents-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('genial-documents-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((doc) => [
      doc.title,
      doc.toolTitle,
      doc.category,
      doc.content,
    ].filter(Boolean).some((part) => String(part).toLowerCase().includes(q)));
  }, [docs, query]);

  const active = docs.find((doc) => doc.id === activeId) || filtered[0] || null;

  function renameActive(title) {
    if (!active) return;
    const updated = updateDocument(active.id, { title });
    if (updated) setDocs(listDocuments());
  }

  function removeActive() {
    if (!active) return;
    deleteDocument(active.id);
    setActiveId(null);
    setDocs(listDocuments());
  }

  async function copyActive() {
    if (!active) return;
    await navigator.clipboard.writeText(active.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function handleExportPDF() {
    if (!active) return;
    setExporting('pdf');
    try {
      const safeTitle = (active.title || 'documento').replace(/\s+/g, '_');
      exportMarkdownPDF(active.content, `${safeTitle}.pdf`, active.toolTitle);
    } finally {
      setExporting('');
    }
  }

  async function handleExportPPTX() {
    if (!active) return;
    setExporting('pptx');
    try {
      const safeTitle = (active.title || 'documento').replace(/\s+/g, '_');
      await exportPPTX(active.content, `${safeTitle}.pptx`, active.toolTitle);
    } finally {
      setExporting('');
    }
  }

  function handleExportWorksheet() {
    if (!active) return;
    setExporting('worksheet');
    try {
      const safeTitle = (active.title || 'documento').replace(/\s+/g, '_');
      exportWorksheet(active.content, `${safeTitle}_worksheet.pdf`, active.toolTitle);
    } finally {
      setExporting('');
    }
  }

  return (
    <div className="docs-page">
      <header className="docs-head">
        <div>
          <div className="eyebrow"><Ic.doc /> Mis documentos</div>
          <h1>Biblioteca de contenido IA</h1>
          <p>Todo lo que generes queda guardado aquí para revisarlo, reutilizarlo y exportarlo cuando estés listo.</p>
        </div>
        <div className="docs-search">
          <Ic.search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por herramienta, tema o contenido..."
          />
        </div>
      </header>

      <section className="docs-shell">
        <aside className="docs-list" aria-label="Documentos generados">
          <div className="docs-list-head">
            <strong>{filtered.length}</strong>
            <span>{filtered.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
          {filtered.map((doc) => (
            <button
              key={doc.id}
              className={`docs-item ${active?.id === doc.id ? 'active' : ''}`}
              onClick={() => setActiveId(doc.id)}
            >
              <span className="docs-item-title">{doc.title}</span>
              <span className="docs-item-meta">{doc.toolTitle} · {formatDate(doc.updatedAt)}</span>
              <span className="docs-item-preview">{(doc.content || '').slice(0, 150)}</span>
            </button>
          ))}
          {!filtered.length && (
            <div className="docs-empty-mini">No hay documentos que coincidan con la búsqueda.</div>
          )}
        </aside>

        <main className="docs-reader">
          {active ? (
            <>
              <div className="docs-reader-head">
                <div>
                  <input
                    className="docs-title-input"
                    value={active.title || ''}
                    onChange={(e) => renameActive(e.target.value)}
                  />
                  <div className="docs-reader-meta">
                    {active.toolTitle} · {formatDate(active.createdAt)}
                    {active.model ? ` · ${active.model}` : ''}
                  </div>
                </div>
                <div className="docs-actions">
                  <button type="button" onClick={copyActive}>{copied ? 'Copiado' : '📋 Copiar'}</button>
                  <button type="button" onClick={handleExportPDF} disabled={!!exporting}>
                    {exporting === 'pdf' ? '⏳ PDF' : '📄 PDF'}
                  </button>
                  <button type="button" onClick={handleExportPPTX} disabled={!!exporting}>
                    {exporting === 'pptx' ? '⏳ PPTX' : '📊 PPTX'}
                  </button>
                  <button type="button" onClick={handleExportWorksheet} disabled={!!exporting}>
                    {exporting === 'worksheet' ? '⏳ Worksheet' : '📝 Worksheet'}
                  </button>
                  <button type="button" className="danger" onClick={removeActive}>🗑️ Borrar</button>
                </div>
              </div>
              <pre className="docs-content">{active.content}</pre>
            </>
          ) : (
            <div className="docs-empty">
              <Ic.doc />
              <h2>Todavía no hay documentos</h2>
              <p>Cuando completes una generación IA, el resultado aparecerá aquí automáticamente.</p>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
