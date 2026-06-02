import React from 'react';
import Ic from '../components/Icons.jsx';
import MarkdownMath from '../components/MarkdownMath.jsx';
import { SlideWorkspace } from '../components/ToolModal.jsx';
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

// Classification helper for smart badges
function classifyDoc(doc) {
  const tool = String(doc.toolTitle || '').toLowerCase();
  const cat = String(doc.category || '').toLowerCase();
  
  if (tool.includes('lección') || tool.includes('leccion') || tool.includes('plan') || tool.includes('clase') || cat === 'planificacion' || cat === 'planificación') {
    return 'leccion';
  }
  if (tool.includes('rúbrica') || tool.includes('rubrica') || tool.includes('examen') || tool.includes('prueba') || tool.includes('pregunta') || tool.includes('dok') || cat === 'evaluacion' || cat === 'evaluación') {
    return 'evaluacion';
  }
  return 'otros';
}

export default function MyDocuments({ onNavigate }) {
  const [docs, setDocs] = React.useState(() => listDocuments());
  const [query, setQuery] = React.useState('');
  const [activeId, setActiveId] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [exporting, setExporting] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('preview'); // 'preview' | 'edit' | 'presentation'
  const [selectedCat, setSelectedCat] = React.useState('all'); // 'all' | 'leccion' | 'evaluacion' | 'otros'

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
    let list = docs;
    
    // Category filter
    if (selectedCat !== 'all') {
      list = list.filter(doc => classifyDoc(doc) === selectedCat);
    }
    
    // Search text filter
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((doc) => [
      doc.title,
      doc.toolTitle,
      doc.category,
      doc.content,
    ].filter(Boolean).some((part) => String(part).toLowerCase().includes(q)));
  }, [docs, selectedCat, query]);

  const active = docs.find((doc) => doc.id === activeId) || filtered[0] || null;

  // Auto-switch tabs to preview if active document has no slides and activeTab is 'presentation'
  const hasSlides = active ? /^\s*##?\s+/m.test(active.content) : false;
  React.useEffect(() => {
    if (activeTab === 'presentation' && !hasSlides) {
      setActiveTab('preview');
    }
  }, [activeId, hasSlides, activeTab]);

  function renameActive(title) {
    if (!active) return;
    const updated = updateDocument(active.id, { title });
    if (updated) setDocs(listDocuments());
  }

  function renameActiveContent(content) {
    if (!active) return;
    const updated = updateDocument(active.id, { content });
    if (updated) setDocs(listDocuments());
  }

  function removeActive() {
    if (!active) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.')) {
      deleteDocument(active.id);
      setActiveId(null);
      setDocs(listDocuments());
    }
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
      </header>

      <section className="docs-shell">
        <aside className="docs-list" aria-label="Documentos generados">
          <div className="docs-list-head">
            <strong>{filtered.length}</strong>
            <span>{filtered.length === 1 ? 'documento' : 'documentos'}</span>
          </div>

          <div className="docs-categories">
            <button 
              type="button" 
              className={`docs-cat-btn ${selectedCat === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCat('all')}
            >
              🗂️ Todos
            </button>
            <button 
              type="button" 
              className={`docs-cat-btn ${selectedCat === 'leccion' ? 'active' : ''}`}
              onClick={() => setSelectedCat('leccion')}
            >
              📝 Lecciones
            </button>
            <button 
              type="button" 
              className={`docs-cat-btn ${selectedCat === 'evaluacion' ? 'active' : ''}`}
              onClick={() => setSelectedCat('evaluacion')}
            >
              📊 Evaluaciones
            </button>
            <button 
              type="button" 
              className={`docs-cat-btn ${selectedCat === 'otros' ? 'active' : ''}`}
              onClick={() => setSelectedCat('otros')}
            >
              📁 Otros
            </button>
          </div>

          <div className="docs-search-bar">
            <div className="docs-search">
              <Ic.search />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en esta categoría..."
              />
            </div>
          </div>

          <div className="docs-items-scroll">
            {filtered.map((doc) => {
              const classification = classifyDoc(doc);
              const badgeLabels = {
                leccion: 'Lección',
                evaluacion: 'Evaluación',
                otros: 'Otros'
              };
              return (
                <button
                  type="button"
                  key={doc.id}
                  className={`docs-item ${active?.id === doc.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveId(doc.id);
                    setActiveTab('preview');
                  }}
                >
                  <div className="docs-item-header">
                    <span className="docs-item-title">{doc.title}</span>
                    <span className={`docs-badge badge-${classification}`}>
                      {badgeLabels[classification]}
                    </span>
                  </div>
                  <div className="docs-item-meta">{formatDate(doc.updatedAt)}</div>
                  <span className="docs-item-preview">{(doc.content || '').slice(0, 120)}</span>
                </button>
              );
            })}
            {!filtered.length && (
              <div className="docs-empty-mini">No hay documentos en esta categoría.</div>
            )}
          </div>
        </aside>

        <main className="docs-reader">
          {active ? (
            <>
              <div className="docs-reader-header-area">
                <div className="docs-reader-head">
                  <div style={{ flex: 1 }}>
                    <input
                      className="docs-title-input"
                      value={active.title || ''}
                      onChange={(e) => renameActive(e.target.value)}
                      placeholder="Título del documento"
                      title="Haz clic para renombrar"
                    />
                    <div className="docs-reader-meta">
                      Herramienta: <b>{active.toolTitle}</b> · Creado: {formatDate(active.createdAt)}
                      {active.model ? ` · Modelo: ${active.model}` : ''}
                    </div>
                  </div>
                  <div className="docs-mode-tabs" role="tablist">
                    <button
                      type="button"
                      className={`docs-mode-tab ${activeTab === 'preview' ? 'active' : ''}`}
                      onClick={() => setActiveTab('preview')}
                    >
                      👁️ Vista Previa
                    </button>
                    <button
                      type="button"
                      className={`docs-mode-tab ${activeTab === 'edit' ? 'active' : ''}`}
                      onClick={() => setActiveTab('edit')}
                    >
                      ✏️ Editar Texto
                    </button>
                    {hasSlides && (
                      <button
                        type="button"
                        className={`docs-mode-tab ${activeTab === 'presentation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('presentation')}
                      >
                        📊 Editar Presentación
                      </button>
                    )}
                  </div>
                </div>

                <div className="docs-action-bar">
                  <div className="docs-download-buttons">
                    <button 
                      type="button" 
                      className="docs-btn-action btn-pdf" 
                      onClick={handleExportPDF} 
                      disabled={!!exporting}
                      title="Descargar como PDF listo para imprimir"
                    >
                      📄 {exporting === 'pdf' ? 'Exportando...' : 'Descargar PDF'}
                    </button>
                    <button 
                      type="button" 
                      className="docs-btn-action btn-pptx" 
                      onClick={handleExportPPTX} 
                      disabled={!!exporting}
                      title="Exportar como presentación editable de PowerPoint"
                    >
                      📊 {exporting === 'pptx' ? 'Exportando...' : 'Descargar PPTX'}
                    </button>
                    <button 
                      type="button" 
                      className="docs-btn-action btn-worksheet" 
                      onClick={handleExportWorksheet} 
                      disabled={!!exporting}
                      title="Descargar como hoja de trabajo con espacio para respuestas"
                    >
                      📝 {exporting === 'worksheet' ? 'Exportando...' : 'Descargar Hoja de Trabajo'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      type="button" 
                      className="docs-btn-action" 
                      onClick={copyActive}
                      title="Copiar texto Markdown al portapapeles"
                    >
                      {copied ? '✅ Copiado' : '📋 Copiar Texto'}
                    </button>
                    <button 
                      type="button" 
                      className="docs-btn-action danger" 
                      onClick={removeActive}
                      title="Eliminar este documento definitivamente"
                    >
                      🗑️ Borrar
                    </button>
                  </div>
                </div>
              </div>

              <div className={`docs-content-container ${activeTab === 'presentation' ? 'mode-presentation' : ''}`}>
                {activeTab === 'preview' ? (
                  <div className="docs-preview-sheet">
                    <MarkdownMath>{active.content}</MarkdownMath>
                  </div>
                ) : activeTab === 'edit' ? (
                  <textarea
                    className="docs-editor-textarea"
                    value={active.content}
                    onChange={(e) => renameActiveContent(e.target.value)}
                    placeholder="Escribe el contenido en formato Markdown aquí..."
                  />
                ) : (
                  <div className="docs-slide-wrapper">
                    <SlideWorkspace value={active.content} onChange={renameActiveContent} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="docs-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <h2>Biblioteca de Documentos vacía</h2>
              <p>Genera contenido educativo utilizando las herramientas IA para guardarlo, organizarlo y descargarlo aquí.</p>
              {onNavigate && (
                <button 
                  type="button" 
                  className="docs-cta-btn"
                  onClick={() => onNavigate('/ai-tools')}
                >
                  Ir a Asistente IA ➔
                </button>
              )}
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
