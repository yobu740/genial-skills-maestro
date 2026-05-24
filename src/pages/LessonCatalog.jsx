import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE APIs
// ─────────────────────────────────────────────────────────────
const BASE_API    = "https://baseapi.genialskillsweb.com";
const ATHENAS_API = "https://athenasapi.genialskillsweb.com";
const PAGE_SIZE   = 8;

// Helper: obtiene el JWT del localStorage (igual que la app original)
function getAuthToken() {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    return auth.Token || null;
  } catch {
    return null;
  }
}

// Headers para cada API (comportamiento real verificado)
const headersBase    = (token) => ({ token, "Content-Type": "application/json" });
const headersAthenas = (token) => ({ Authorization: `Bearer ${token}` });

// ─────────────────────────────────────────────────────────────
//  MOCK DATA DE RESPALDO (data real capturada de la API)
// ─────────────────────────────────────────────────────────────
const FALLBACK_SUBJECTS = [
  { Code: "sp",     Name: "Español" },
  { Code: "mat-sp", Name: "Matemáticas" },
  { Code: "sci-sp", Name: "Ciencias" },
  { Code: "sci-so", Name: "Estudios Sociales" },
  { Code: "art-sp", Name: "Bellas Artes" },
  { Code: "edf-sp", Name: "Educación Física" },
  { Code: "en",     Name: "English" },
  { Code: "mat-en", Name: "Math (English)" },
  { Code: "sci-en", Name: "Science (English)" },
  { Code: "bi-sp",  Name: "Biología" },
  { Code: "qu-sp",  Name: "Química" },
  { Code: "a1-sp",  Name: "Álgebra I" },
];

const FALLBACK_GRADES = [
  { Code: "k", Name: "K" }, { Code: "1", Name: "1" },
  { Code: "2", Name: "2" }, { Code: "3", Name: "3" },
  { Code: "4", Name: "4" }, { Code: "5", Name: "5" },
  { Code: "6", Name: "6" }, { Code: "7", Name: "7" },
  { Code: "8", Name: "8" }, { Code: "9", Name: "9" },
  { Code: "10", Name: "10" }, { Code: "11", Name: "11" },
  { Code: "12", Name: "12" },
];

const FALLBACK_LESSONS = [
  { Id: "205105", LevelCode: "k", SubjectCode: "sp",     LessonTitle: "C5 Identifica el inicio y el cierre de una oración", std: "K.LLI.5" },
  { Id: "205083", LevelCode: "k", SubjectCode: "sp",     LessonTitle: "C6 Por qué separamos las palabras",                  std: "K.LLI.5" },
  { Id: "205082", LevelCode: "k", SubjectCode: "sp",     LessonTitle: "C6 Espacios que ayudan a leer con fluidez",          std: "K.LLI.5" },
  { Id: "205044", LevelCode: "k", SubjectCode: "sp",     LessonTitle: "C5 Aprendo palabras con imágenes",                   std: "K.LLI.5.1" },
  { Id: "205039", LevelCode: "k", SubjectCode: "mat-en", LessonTitle: "Comparison, Contrast, and Order of Objects",         std: "K.M.10.2" },
  { Id: "205038", LevelCode: "k", SubjectCode: "mat-en", LessonTitle: "Organizing Data",                                    std: "K.E.13.1" },
  { Id: "205037", LevelCode: "k", SubjectCode: "mat-en", LessonTitle: "What Time Is It?",                                   std: "K.M.11.4" },
  { Id: "205036", LevelCode: "k", SubjectCode: "mat-en", LessonTitle: "Addition, Subtraction, and Equal Signs",             std: "K.A.6.1" },
];

const SUBJECT_LABEL = {
  sp: "Español", "mat-sp": "Matemáticas", "sci-sp": "Ciencias",
  "sci-so": "Est. Sociales", en: "English", "mat-en": "Math",
  "sci-en": "Science", "art-sp": "Bellas Artes", "edf-sp": "Ed. Física",
  "bi-sp": "Biología", "qu-sp": "Química", "a1-sp": "Álgebra I",
  "a2": "Álgebra II", "geo-sp": "Geometría", "fi-sp": "Física",
  "bi-en": "Biology", "che-en": "Chemistry", "phy-en": "Physics",
};

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────
function FilterCheckbox({ label, value, checked, onChange }) {
  return (
    <label style={styles.filterCheck}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(value, e.target.checked)}
        style={{ accentColor: "#27466C", cursor: "pointer" }}
      />
      <span style={{ fontSize: 13 }}>{label}</span>
    </label>
  );
}

function LessonCard({ lesson, onAssign, onDetail }) {
  const m        = lesson.LessonModel || lesson;
  const std      = lesson.LessonStandardModelList?.[0];
  const stdCode  = std?.Code || lesson.std || null;
  const subject  = SUBJECT_LABEL[m.SubjectCode] || m.SubjectCode || "—";
  const level    = (m.LevelCode || "—").toUpperCase();

  return (
    <div style={styles.lessonCard}>
      {/* Thumbnail */}
      <div style={styles.lessonThumb}>
        <span style={{ fontSize: 28, opacity: 0.3 }}>📖</span>
        <span style={styles.levelBadge}>Grado {level}</span>
        <span style={styles.subjectBadge}>{subject}</span>
      </div>

      {/* Body */}
      <div style={styles.lessonBody}>
        <p style={styles.lessonTitle}>{m.LessonTitle || "Sin título"}</p>
        {stdCode && <code style={styles.lessonCode}>{stdCode}</code>}
      </div>

      {/* Actions */}
      <div style={styles.lessonActions}>
        <button style={styles.btnPrimary} onClick={() => onDetail(m)}>
          Ver detalles
        </button>
        <button style={styles.btnSecondary} onClick={() => onAssign(m)}>
          Asignar a plan
        </button>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalResults, pageSize, onPage }) {
  const totalPages = Math.ceil(totalResults / pageSize);
  if (totalPages <= 1) return null;
  const start = Math.max(0, currentPage - 2);
  const end   = Math.min(totalPages - 1, currentPage + 2);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div style={styles.pagination}>
      {currentPage > 0 && (
        <button style={styles.pageBtn} onClick={() => onPage(currentPage - 1)}>
          ← Anterior
        </button>
      )}
      {pages.map((p) => (
        <button
          key={p}
          style={{ ...styles.pageBtn, ...(p === currentPage ? styles.pageBtnActive : {}) }}
          onClick={() => onPage(p)}
        >
          {p + 1}
        </button>
      ))}
      {currentPage < totalPages - 1 && (
        <button style={styles.pageBtn} onClick={() => onPage(currentPage + 1)}>
          Siguiente →
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

/**
 * LessonCatalog
 *
 * Props:
 *   token          {string}   JWT override (opcional — si no se pasa, lo lee de localStorage)
 *   onAssignLesson {function} Callback cuando el maestro elige "Asignar a plan" → recibe lessonModel
 *   onViewDetail   {function} Callback cuando elige "Ver detalles" → recibe lessonModel
 */
export default function LessonCatalog({ token: tokenProp, onAssignLesson, onViewDetail }) {
  const [token,           setToken]           = useState(tokenProp || null);
  const [subjects,        setSubjects]        = useState([]);
  const [grades,          setGrades]          = useState([]);
  const [lessons,         setLessons]         = useState([]);
  const [totalResults,    setTotalResults]    = useState(0);
  const [currentPage,     setCurrentPage]     = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [usingFallback,   setUsingFallback]   = useState(false);

  // Filtros
  const [selSubjects, setSelSubjects] = useState(new Set());
  const [selGrades,   setSelGrades]   = useState(new Set());
  const [stdInput,    setStdInput]    = useState("");
  const [textInput,   setTextInput]   = useState("");
  const [sortBy,      setSortBy]      = useState("date");

  // ── Inicialización: cargar token + filtros ──
  useEffect(() => {
    const t = tokenProp || getAuthToken();
    setToken(t);
    loadFilters(t);
  }, [tokenProp]);

  async function loadFilters(t) {
    try {
      const [sRes, gRes] = await Promise.all([
        fetch(`${ATHENAS_API}/api/subjects`, { headers: headersAthenas(t) }).then((r) => r.json()),
        fetch(`${BASE_API}/teachersapi/grades`, { headers: headersBase(t) }).then((r) => r.json()),
      ]);
      setSubjects(Array.isArray(sRes) ? sRes.slice(0, 20) : FALLBACK_SUBJECTS);
      setGrades(Array.isArray(gRes) ? gRes : FALLBACK_GRADES);
    } catch {
      setSubjects(FALLBACK_SUBJECTS);
      setGrades(FALLBACK_GRADES);
    }
  }

  // ── Búsqueda ──
  const doSearch = useCallback(
    async (page = 0) => {
      setLoading(true);
      setCurrentPage(page);

      const body = {
        SubjectCodes:     [...selSubjects],
        LevelCodes:       [...selGrades],
        StandardCodes:    [],
        ExpectationCodes: [],
        PageNumber:       page,
        ContentFilter:    stdInput.trim(),
        Limit:            PAGE_SIZE,
        OrderByCreationDate: sortBy === "date" ? true : null,
        OrderByTitle:        sortBy === "title" ? true : null,
        TeacherInputText: textInput.trim(),
      };

      try {
        const res  = await fetch(`${BASE_API}/teachersapi/lessons/advance`, {
          method:  "POST",
          headers: headersBase(token),
          body:    JSON.stringify(body),
        });
        const data = await res.json();
        const list = data.LessonsDetails?.Lessons || [];
        if (list.length === 0 && page === 0 && !selSubjects.size && !selGrades.size) {
          throw new Error("empty");
        }
        setLessons(list);
        setTotalResults(data.LessonsDetails?.TotalResults || list.length);
        setUsingFallback(false);
      } catch {
        setLessons(FALLBACK_LESSONS);
        setTotalResults(2477);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    },
    [token, selSubjects, selGrades, stdInput, textInput, sortBy]
  );

  // Búsqueda inicial al montar
  useEffect(() => {
    if (subjects.length > 0) doSearch(0);
  }, [subjects]);

  function clearFilters() {
    setSelSubjects(new Set());
    setSelGrades(new Set());
    setStdInput("");
    setTextInput("");
    setSortBy("date");
    setCurrentPage(0);
  }

  function toggleSubject(code, checked) {
    setSelSubjects((prev) => {
      const next = new Set(prev);
      checked ? next.add(code) : next.delete(code);
      return next;
    });
  }

  function toggleGrade(code, checked) {
    setSelGrades((prev) => {
      const next = new Set(prev);
      checked ? next.add(code) : next.delete(code);
      return next;
    });
  }

  const handleDetail = (m) => {
    if (onViewDetail) onViewDetail(m);
    else alert(`Lección: ${m.LessonTitle}`);
  };

  const handleAssign = (m) => {
    if (onAssignLesson) onAssignLesson(m);
    else alert(`Asignar lección ${m.Id} — ${m.LessonTitle}`);
  };

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={styles.wrap}>
      {/* ── SIDEBAR ── */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>FILTROS</span>
          {!usingFallback && (
            <span style={styles.apiBadge}>● API live</span>
          )}
        </div>

        {/* Materias */}
        <div style={styles.filterSection}>
          <p style={styles.filterSectionTitle}>Materias</p>
          <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
            {subjects.map((s) => (
              <FilterCheckbox
                key={s.Code}
                label={s.Name}
                value={s.Code}
                checked={selSubjects.has(s.Code)}
                onChange={toggleSubject}
              />
            ))}
          </div>
        </div>

        {/* Grados */}
        <div style={styles.filterSection}>
          <p style={styles.filterSectionTitle}>Grados</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {grades.map((g) => (
              <FilterCheckbox
                key={g.Code}
                label={`Grado ${g.Name}`}
                value={g.Code}
                checked={selGrades.has(g.Code)}
                onChange={toggleGrade}
              />
            ))}
          </div>
        </div>

        {/* Estándar */}
        <div style={styles.filterSection}>
          <p style={styles.filterSectionTitle}>Estándares / Expectativas</p>
          <input
            style={styles.filterInput}
            type="text"
            placeholder="Ej: K.LLI.5"
            value={stdInput}
            onChange={(e) => setStdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch(0)}
          />
        </div>

        {/* Texto */}
        <div style={styles.filterSection}>
          <p style={styles.filterSectionTitle}>Texto libre</p>
          <input
            style={styles.filterInput}
            type="text"
            placeholder="Buscar en título…"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch(0)}
          />
        </div>

        {/* Botones */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <button style={styles.btnBuscar} onClick={() => doSearch(0)}>
            Buscar
          </button>
          <button style={styles.btnLimpiar} onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ── */}
      <main style={styles.main}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <h1 style={styles.topBarTitle}>Catálogo de lecciones</h1>
          <div style={styles.topBarRight}>
            <span style={{ fontSize: 13, color: "#888" }}>Organizar por:</span>
            <select
              style={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Fecha de creación</option>
              <option value="title">Título</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div style={styles.statusBar}>
          {loading
            ? "Buscando lecciones…"
            : `${totalResults.toLocaleString()} lecciones encontradas${usingFallback ? " (modo demo)" : ""} — página ${currentPage + 1} de ${Math.ceil(totalResults / PAGE_SIZE)}`}
        </div>

        {/* Grid de lecciones */}
        {loading ? (
          <div style={styles.loadingState}>Cargando…</div>
        ) : lessons.length === 0 ? (
          <div style={styles.emptyState}>
            No se encontraron lecciones con esos filtros.
          </div>
        ) : (
          <div style={styles.grid}>
            {lessons.map((l) => (
              <LessonCard
                key={(l.LessonModel?.Id || l.Id)}
                lesson={l}
                onDetail={handleDetail}
                onAssign={handleAssign}
              />
            ))}
          </div>
        )}

        {/* Paginación */}
        {!loading && (
          <Pagination
            currentPage={currentPage}
            totalResults={totalResults}
            pageSize={PAGE_SIZE}
            onPage={(p) => doSearch(p)}
          />
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ESTILOS (CSS-in-JS — sin dependencias externas)
// ─────────────────────────────────────────────────────────────
const styles = {
  wrap: {
    display: "flex",
    minHeight: 600,
    background: "#F4F6F9",
    borderRadius: 12,
    border: "0.5px solid #e0e4ea",
    overflow: "hidden",
    fontFamily: "inherit",
  },
  sidebar: {
    width: 220,
    minWidth: 220,
    background: "#fff",
    borderRight: "0.5px solid #e0e4ea",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#888",
  },
  apiBadge: {
    fontSize: 10,
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: 20,
    background: "#e8f5f0",
    color: "#0F6E56",
    border: "0.5px solid #5DCAA5",
  },
  filterSection: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: "#666",
    paddingBottom: 4,
    borderBottom: "0.5px solid #e0e4ea",
    marginBottom: 2,
  },
  filterCheck: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "2px 0",
    cursor: "pointer",
  },
  filterInput: {
    fontSize: 13,
    padding: "6px 8px",
    borderRadius: 8,
    border: "0.5px solid #ccc",
    background: "#f8f9fb",
    color: "#222",
    width: "100%",
    outline: "none",
  },
  btnBuscar: {
    background: "#27466C",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 0",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
  },
  btnLimpiar: {
    background: "transparent",
    color: "#888",
    border: "0.5px solid #ccc",
    borderRadius: 8,
    padding: "8px 0",
    fontSize: 12,
    cursor: "pointer",
    width: "100%",
  },
  main: {
    flex: 1,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    overflow: "hidden",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: "#222",
    margin: 0,
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  sortSelect: {
    fontSize: 13,
    padding: "5px 8px",
    borderRadius: 8,
    border: "0.5px solid #ccc",
    background: "#f8f9fb",
    color: "#222",
    cursor: "pointer",
  },
  statusBar: {
    fontSize: 12,
    color: "#666",
    padding: "6px 12px",
    background: "#fff",
    borderRadius: 8,
    border: "0.5px solid #e0e4ea",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 10,
  },
  lessonCard: {
    background: "#fff",
    borderRadius: 12,
    border: "0.5px solid #e0e4ea",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  lessonThumb: {
    height: 88,
    background: "#e8edf3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  levelBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    background: "#27466C",
    color: "#fff",
    fontSize: 10,
    fontWeight: 500,
    padding: "2px 7px",
    borderRadius: 20,
  },
  subjectBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    background: "#f0f2f5",
    color: "#555",
    fontSize: 10,
    padding: "2px 7px",
    borderRadius: 20,
    border: "0.5px solid #dde0e5",
  },
  lessonBody: {
    padding: "10px 10px 6px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  lessonTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: "#222",
    lineHeight: 1.4,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    margin: 0,
  },
  lessonCode: {
    fontSize: 11,
    color: "#888",
    fontFamily: "monospace",
  },
  lessonActions: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "0 10px 10px",
  },
  btnPrimary: {
    fontSize: 11,
    padding: "5px 8px",
    borderRadius: 8,
    cursor: "pointer",
    border: "none",
    background: "#27466C",
    color: "#fff",
    textAlign: "center",
    width: "100%",
    fontWeight: 500,
  },
  btnSecondary: {
    fontSize: 11,
    padding: "5px 8px",
    borderRadius: 8,
    cursor: "pointer",
    border: "0.5px solid #ccc",
    background: "transparent",
    color: "#555",
    textAlign: "center",
    width: "100%",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  pageBtn: {
    padding: "5px 12px",
    borderRadius: 8,
    border: "0.5px solid #ccc",
    background: "transparent",
    color: "#555",
    fontSize: 13,
    cursor: "pointer",
  },
  pageBtnActive: {
    background: "#27466C",
    color: "#fff",
    borderColor: "#27466C",
  },
  loadingState: {
    textAlign: "center",
    padding: "3rem",
    color: "#888",
    fontSize: 14,
  },
  emptyState: {
    textAlign: "center",
    padding: "2rem",
    color: "#888",
    fontSize: 13,
    background: "#fff",
    borderRadius: 12,
    border: "0.5px solid #e0e4ea",
  },
};
