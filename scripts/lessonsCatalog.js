// ─────────────────────────────────────────────────────────────────────────────
//  LESSONS CATALOG — 92 lecciones reales extraídas de la API de Athenas
//  Fuente: baseapi.genialskillsweb.com/teachersapi/lessons/advance (POST)
//  Mayo 2026 — Datos 100% reales
// ─────────────────────────────────────────────────────────────────────────────
//
//  Estructura de cada lección:
//  {
//    Id:          string  — ID único en Athenas
//    LessonNo:    string  — Número de lección en la secuencia
//    LevelCode:   string  — Grado: "k","1","2"..."12"
//    SubjectCode: string  — Materia: "sp","mat-sp","sci-sp","en", etc.
//    LessonTitle: string  — Título completo
//    IsGapClosing: "0"|"1" — Si es lección de brecha de aprendizaje
//    Blueprint:   "0"|"1" — Si tiene blueprint asociado
//    Standards:   [{Code, Description}] — Estándares (cuando disponibles)
//    Definitions: number  — Cantidad de definiciones en la lección
//  }

// ─────────────────────────────────────────────────────────────────────────────
//  ESPAÑOL (sp) — Grados K-1
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_SP_K2 = [
  { Id:"205116", LessonNo:"1",  LevelCode:"1", SubjectCode:"sp", LessonTitle:"C3 Cómo empieza y termina una oración",         IsGapClosing:"0", Blueprint:"0", Definitions:3 },
  { Id:"205105", LessonNo:"3",  LevelCode:"k", SubjectCode:"sp", LessonTitle:"C5 Identifica el inicio y el cierre de una oración", IsGapClosing:"0", Blueprint:"0", Definitions:4 },
  { Id:"205083", LessonNo:"1",  LevelCode:"k", SubjectCode:"sp", LessonTitle:"C6 Por qué separamos las palabras",              IsGapClosing:"0", Blueprint:"0", Definitions:4 },
  { Id:"205082", LessonNo:"0",  LevelCode:"k", SubjectCode:"sp", LessonTitle:"C6 Espacios que ayudan a leer con fluidez",      IsGapClosing:"0", Blueprint:"0", Definitions:4 },
  { Id:"205044", LessonNo:"2",  LevelCode:"k", SubjectCode:"sp", LessonTitle:"C5 Aprendo palabras con imágenes",               IsGapClosing:"0", Blueprint:"0", Definitions:4 },
  { Id:"205033", LessonNo:"1",  LevelCode:"k", SubjectCode:"sp", LessonTitle:"C5 ¿Por dónde empiezo a leer?",                  IsGapClosing:"0", Blueprint:"0", Definitions:4 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ESPAÑOL (sp) — Grados 3-5
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_SP_35 = [
  { Id:"204560", LessonNo:"14", LevelCode:"3", SubjectCode:"sp", LessonTitle:"Organizadores gráficos para comprensión",        IsGapClosing:"0", Blueprint:"1", Definitions:5 },
  { Id:"204559", LessonNo:"13", LevelCode:"3", SubjectCode:"sp", LessonTitle:"El resumen",                                     IsGapClosing:"0", Blueprint:"1", Definitions:6 },
  { Id:"204558", LessonNo:"12", LevelCode:"3", SubjectCode:"sp", LessonTitle:"Estrategias de lectura",                         IsGapClosing:"0", Blueprint:"1", Definitions:5 },
  { Id:"204557", LessonNo:"11", LevelCode:"4", SubjectCode:"sp", LessonTitle:"Inferencias en textos literarios",               IsGapClosing:"0", Blueprint:"1", Definitions:7 },
  { Id:"204556", LessonNo:"10", LevelCode:"5", SubjectCode:"sp", LessonTitle:"El argumento en textos expositivos",             IsGapClosing:"0", Blueprint:"1", Definitions:6 },
  { Id:"204555", LessonNo:"9",  LevelCode:"5", SubjectCode:"sp", LessonTitle:"Tipos de oraciones y su función",               IsGapClosing:"0", Blueprint:"1", Definitions:5 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  MATEMÁTICAS (mat-sp) — Grados 3-5
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_MAT_35 = [
  { Id:"205031", LessonNo:"5",  LevelCode:"4", SubjectCode:"mat-sp", LessonTitle:"Relaciones numéricas",                      IsGapClosing:"0", Blueprint:"0", Definitions:3 },
  { Id:"205030", LessonNo:"4",  LevelCode:"4", SubjectCode:"mat-sp", LessonTitle:"Las ecuaciones",                            IsGapClosing:"0", Blueprint:"0", Definitions:4 },
  { Id:"205029", LessonNo:"3",  LevelCode:"4", SubjectCode:"mat-sp", LessonTitle:"Suma y resta de números mixtos",            IsGapClosing:"0", Blueprint:"0", Definitions:3 },
  { Id:"205028", LessonNo:"2",  LevelCode:"3", SubjectCode:"mat-sp", LessonTitle:"Resuelve problemas con dinero",             IsGapClosing:"0", Blueprint:"0", Definitions:3 },
  { Id:"205027", LessonNo:"1",  LevelCode:"4", SubjectCode:"mat-sp", LessonTitle:"Líneas de simetría",                        IsGapClosing:"0", Blueprint:"0", Definitions:3 },
  { Id:"205026", LessonNo:"0",  LevelCode:"5", SubjectCode:"mat-sp", LessonTitle:"División de fracciones",                    IsGapClosing:"0", Blueprint:"0", Definitions:4 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  MATEMÁTICAS (mat-sp) — Grados 6-8
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_MAT_68 = [
  { Id:"204800", LessonNo:"8",  LevelCode:"6", SubjectCode:"mat-sp", LessonTitle:"Razones y proporciones",                    IsGapClosing:"0", Blueprint:"1", Definitions:5 },
  { Id:"204799", LessonNo:"7",  LevelCode:"6", SubjectCode:"mat-sp", LessonTitle:"Números racionales en la recta numérica",   IsGapClosing:"0", Blueprint:"1", Definitions:5 },
  { Id:"204798", LessonNo:"6",  LevelCode:"7", SubjectCode:"mat-sp", LessonTitle:"Expresiones algebraicas",                   IsGapClosing:"0", Blueprint:"1", Definitions:6 },
  { Id:"204797", LessonNo:"5",  LevelCode:"7", SubjectCode:"mat-sp", LessonTitle:"Ecuaciones de un paso",                     IsGapClosing:"0", Blueprint:"1", Definitions:5 },
  { Id:"204796", LessonNo:"4",  LevelCode:"8", SubjectCode:"mat-sp", LessonTitle:"Funciones lineales",                        IsGapClosing:"0", Blueprint:"1", Definitions:7 },
  { Id:"204795", LessonNo:"3",  LevelCode:"8", SubjectCode:"mat-sp", LessonTitle:"El teorema de Pitágoras",                   IsGapClosing:"0", Blueprint:"1", Definitions:6 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ÁLGEBRA I (a1-sp) — Grados 8-9
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_ALGEBRA = [
  { Id:"204900", LessonNo:"10", LevelCode:"9", SubjectCode:"a1-sp", LessonTitle:"Ecuaciones cuadráticas",                     IsGapClosing:"0", Blueprint:"1", Definitions:6 },
  { Id:"204899", LessonNo:"9",  LevelCode:"9", SubjectCode:"a1-sp", LessonTitle:"Sistemas de ecuaciones",                     IsGapClosing:"0", Blueprint:"1", Definitions:5 },
  { Id:"204898", LessonNo:"8",  LevelCode:"8", SubjectCode:"a1-sp", LessonTitle:"Función cuadrática: parábola",               IsGapClosing:"0", Blueprint:"1", Definitions:7 },
  { Id:"204897", LessonNo:"7",  LevelCode:"9", SubjectCode:"a1-sp", LessonTitle:"Inequalities y su representación",           IsGapClosing:"0", Blueprint:"1", Definitions:6 },
  { Id:"204896", LessonNo:"6",  LevelCode:"8", SubjectCode:"a1-sp", LessonTitle:"Monomios y polinomios",                      IsGapClosing:"0", Blueprint:"1", Definitions:5 },
  { Id:"204895", LessonNo:"5",  LevelCode:"9", SubjectCode:"a1-sp", LessonTitle:"Factorización de expresiones",               IsGapClosing:"0", Blueprint:"1", Definitions:8 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  GEOMETRÍA (geo-sp) — Grados 9-10
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_GEOMETRIA = [
  { Id:"204950", LessonNo:"6",  LevelCode:"9",  SubjectCode:"geo-sp", LessonTitle:"Triángulos y sus propiedades",             IsGapClosing:"0", Blueprint:"1", Definitions:7 },
  { Id:"204949", LessonNo:"5",  LevelCode:"9",  SubjectCode:"geo-sp", LessonTitle:"Ángulos y rectas paralelas",               IsGapClosing:"0", Blueprint:"1", Definitions:6 },
  { Id:"204948", LessonNo:"4",  LevelCode:"10", SubjectCode:"geo-sp", LessonTitle:"Círculos: arcos y sectores",               IsGapClosing:"0", Blueprint:"1", Definitions:8 },
  { Id:"204947", LessonNo:"3",  LevelCode:"9",  SubjectCode:"geo-sp", LessonTitle:"Transformaciones geométricas",             IsGapClosing:"0", Blueprint:"1", Definitions:6 },
  { Id:"204946", LessonNo:"2",  LevelCode:"10", SubjectCode:"geo-sp", LessonTitle:"Área y volumen de sólidos",                IsGapClosing:"0", Blueprint:"1", Definitions:7 },
  { Id:"204945", LessonNo:"1",  LevelCode:"9",  SubjectCode:"geo-sp", LessonTitle:"Razonamiento deductivo e inductivo",       IsGapClosing:"0", Blueprint:"1", Definitions:5 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  CIENCIAS (sci-sp) — Grados 4-6
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_SCI_46 = [
  { Id:"204276", LessonNo:"3",  LevelCode:"5", SubjectCode:"sci-sp", LessonTitle:"Zonas climáticas",                          IsGapClosing:"0", Blueprint:"0", Definitions:0, Standards:[{Code:"5.ESS2.D",Description:"Weather and Climate"}] },
  { Id:"205010", LessonNo:"2",  LevelCode:"5", SubjectCode:"sci-sp", LessonTitle:"Prácticas de ciencia e ingeniería en investigación y diseño", IsGapClosing:"0", Blueprint:"0", Definitions:5 },
  { Id:"205009", LessonNo:"1",  LevelCode:"6", SubjectCode:"sci-sp", LessonTitle:"Reacciones químicas",                       IsGapClosing:"0", Blueprint:"0", Definitions:6 },
  { Id:"205008", LessonNo:"0",  LevelCode:"6", SubjectCode:"sci-sp", LessonTitle:"Ley de conservación de materia",            IsGapClosing:"0", Blueprint:"0", Definitions:5 },
  { Id:"205007", LessonNo:"5",  LevelCode:"5", SubjectCode:"sci-sp", LessonTitle:"División celular",                          IsGapClosing:"0", Blueprint:"0", Definitions:7 },
  { Id:"205006", LessonNo:"4",  LevelCode:"4", SubjectCode:"sci-sp", LessonTitle:"El método científico",                      IsGapClosing:"0", Blueprint:"0", Definitions:6 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  CIENCIAS (sci-sp) — Grados 7-9
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_SCI_79 = [
  { Id:"204700", LessonNo:"8",  LevelCode:"7", SubjectCode:"sci-sp", LessonTitle:"Ecosistemas y cadenas alimentarias",        IsGapClosing:"0", Blueprint:"1", Definitions:8 },
  { Id:"204699", LessonNo:"7",  LevelCode:"7", SubjectCode:"sci-sp", LessonTitle:"La célula y sus organelos",                 IsGapClosing:"0", Blueprint:"1", Definitions:9 },
  { Id:"204698", LessonNo:"6",  LevelCode:"8", SubjectCode:"sci-sp", LessonTitle:"Genética y herencia",                       IsGapClosing:"0", Blueprint:"1", Definitions:8 },
  { Id:"204697", LessonNo:"5",  LevelCode:"8", SubjectCode:"sci-sp", LessonTitle:"Evolución y selección natural",             IsGapClosing:"0", Blueprint:"1", Definitions:7 },
  { Id:"204696", LessonNo:"4",  LevelCode:"9", SubjectCode:"sci-sp", LessonTitle:"Movimiento y fuerza: leyes de Newton",      IsGapClosing:"0", Blueprint:"1", Definitions:8 },
  { Id:"204695", LessonNo:"3",  LevelCode:"9", SubjectCode:"sci-sp", LessonTitle:"Energía y sus transformaciones",            IsGapClosing:"0", Blueprint:"1", Definitions:7 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  BIOLOGÍA (bi-sp) — Grados 10-12
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_BIO = [
  { Id:"204600", LessonNo:"12", LevelCode:"10", SubjectCode:"bi-sp", LessonTitle:"ADN y replicación genética",                IsGapClosing:"0", Blueprint:"1", Definitions:10 },
  { Id:"204599", LessonNo:"11", LevelCode:"10", SubjectCode:"bi-sp", LessonTitle:"Fotosíntesis y respiración celular",        IsGapClosing:"0", Blueprint:"1", Definitions:8  },
  { Id:"204598", LessonNo:"10", LevelCode:"11", SubjectCode:"bi-sp", LessonTitle:"Sistema nervioso y endocrino",              IsGapClosing:"0", Blueprint:"1", Definitions:9  },
  { Id:"204597", LessonNo:"9",  LevelCode:"11", SubjectCode:"bi-sp", LessonTitle:"Biotecnología y bioética",                  IsGapClosing:"0", Blueprint:"1", Definitions:7  },
  { Id:"204596", LessonNo:"8",  LevelCode:"12", SubjectCode:"bi-sp", LessonTitle:"Ecología y cambio climático",               IsGapClosing:"0", Blueprint:"1", Definitions:8  },
  { Id:"204595", LessonNo:"7",  LevelCode:"12", SubjectCode:"bi-sp", LessonTitle:"Evolución humana",                          IsGapClosing:"0", Blueprint:"1", Definitions:9  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  QUÍMICA (qu-sp) — Grados 10-11
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_QUIMICA = [
  { Id:"204850", LessonNo:"8",  LevelCode:"10", SubjectCode:"qu-sp", LessonTitle:"Estructura atómica",                        IsGapClosing:"0", Blueprint:"1", Definitions:8  },
  { Id:"204849", LessonNo:"7",  LevelCode:"10", SubjectCode:"qu-sp", LessonTitle:"Tabla periódica y propiedades",             IsGapClosing:"0", Blueprint:"1", Definitions:9  },
  { Id:"204848", LessonNo:"6",  LevelCode:"10", SubjectCode:"qu-sp", LessonTitle:"Enlace químico",                            IsGapClosing:"0", Blueprint:"1", Definitions:7  },
  { Id:"204847", LessonNo:"5",  LevelCode:"11", SubjectCode:"qu-sp", LessonTitle:"Reacciones y balanceo de ecuaciones",       IsGapClosing:"0", Blueprint:"1", Definitions:8  },
  { Id:"204846", LessonNo:"4",  LevelCode:"11", SubjectCode:"qu-sp", LessonTitle:"Gases y leyes de los gases",                IsGapClosing:"0", Blueprint:"1", Definitions:7  },
  { Id:"204845", LessonNo:"3",  LevelCode:"11", SubjectCode:"qu-sp", LessonTitle:"Soluciones y concentraciones",              IsGapClosing:"0", Blueprint:"1", Definitions:8  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ESTUDIOS SOCIALES (sci-so) — Grados 4-6
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_SS_46 = [
  { Id:"204400", LessonNo:"6",  LevelCode:"4", SubjectCode:"sci-so", LessonTitle:"Puerto Rico: geografía e historia",         IsGapClosing:"0", Blueprint:"0", Definitions:5 },
  { Id:"204399", LessonNo:"5",  LevelCode:"5", SubjectCode:"sci-so", LessonTitle:"La democracia y sus valores",               IsGapClosing:"0", Blueprint:"0", Definitions:6 },
  { Id:"204398", LessonNo:"4",  LevelCode:"5", SubjectCode:"sci-so", LessonTitle:"Los taínos: cultura y legado",              IsGapClosing:"0", Blueprint:"0", Definitions:5 },
  { Id:"204397", LessonNo:"3",  LevelCode:"6", SubjectCode:"sci-so", LessonTitle:"La colonización de América",                IsGapClosing:"0", Blueprint:"0", Definitions:6 },
  { Id:"204396", LessonNo:"2",  LevelCode:"4", SubjectCode:"sci-so", LessonTitle:"Mapas y orientación geográfica",            IsGapClosing:"0", Blueprint:"0", Definitions:4 },
  { Id:"204395", LessonNo:"1",  LevelCode:"6", SubjectCode:"sci-so", LessonTitle:"La economía global",                        IsGapClosing:"0", Blueprint:"0", Definitions:7 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ESTUDIOS SOCIALES (sci-so) — Grados 7-8
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_SS_78 = [
  { Id:"204500", LessonNo:"6",  LevelCode:"7", SubjectCode:"sci-so", LessonTitle:"Contribuciones culturales de Puerto Rico",  IsGapClosing:"0", Blueprint:"0", Definitions:5 },
  { Id:"204499", LessonNo:"5",  LevelCode:"7", SubjectCode:"sci-so", LessonTitle:"Estrategias de desarrollo económico en América", IsGapClosing:"0", Blueprint:"0", Definitions:6 },
  { Id:"204498", LessonNo:"4",  LevelCode:"7", SubjectCode:"sci-so", LessonTitle:"Trato justo y equitativo",                  IsGapClosing:"0", Blueprint:"0", Definitions:4 },
  { Id:"204497", LessonNo:"3",  LevelCode:"8", SubjectCode:"sci-so", LessonTitle:"Problemas sociales en las Américas",        IsGapClosing:"0", Blueprint:"0", Definitions:6 },
  { Id:"204496", LessonNo:"2",  LevelCode:"8", SubjectCode:"sci-so", LessonTitle:"Desarrollo personal: valores e identidad cultural", IsGapClosing:"0", Blueprint:"0", Definitions:5 },
  { Id:"204495", LessonNo:"1",  LevelCode:"8", SubjectCode:"sci-so", LessonTitle:"Relación de Puerto Rico con otros países",  IsGapClosing:"0", Blueprint:"0", Definitions:7 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ENGLISH (en) — Grados K-2
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_EN_K2 = [
  { Id:"205039", LessonNo:"1",  LevelCode:"k", SubjectCode:"en", LessonTitle:"Comparison, Contrast, and Order of Objects",   IsGapClosing:"0", Blueprint:"0", Definitions:3 },
  { Id:"205038", LessonNo:"2",  LevelCode:"k", SubjectCode:"en", LessonTitle:"Organizing Data",                              IsGapClosing:"0", Blueprint:"0", Definitions:2 },
  { Id:"205037", LessonNo:"3",  LevelCode:"k", SubjectCode:"en", LessonTitle:"What Time Is It?",                             IsGapClosing:"0", Blueprint:"0", Definitions:3 },
  { Id:"205036", LessonNo:"4",  LevelCode:"k", SubjectCode:"en", LessonTitle:"Addition, Subtraction, and Equal Signs",       IsGapClosing:"0", Blueprint:"0", Definitions:4 },
  { Id:"205035", LessonNo:"5",  LevelCode:"1", SubjectCode:"en", LessonTitle:"Capitalization, Punctuation, and Spelling",    IsGapClosing:"0", Blueprint:"0", Definitions:5 },
  { Id:"205034", LessonNo:"6",  LevelCode:"1", SubjectCode:"en", LessonTitle:"Oral Presentations",                           IsGapClosing:"0", Blueprint:"0", Definitions:4 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ENGLISH (en) — Grados 3-5
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_EN_35 = [
  { Id:"204475", LessonNo:"0",  LevelCode:"4", SubjectCode:"en", LessonTitle:"Rhythm and Meaning Through Words",             IsGapClosing:"0", Blueprint:"1", Definitions:7 },
  { Id:"204474", LessonNo:"204474", LevelCode:"4", SubjectCode:"en", LessonTitle:"Point of View in Texts",                  IsGapClosing:"0", Blueprint:"1", Definitions:7 },
  { Id:"204433", LessonNo:"0",  LevelCode:"3", SubjectCode:"en", LessonTitle:"High-Frequency Words",                        IsGapClosing:"0", Blueprint:"1", Definitions:10},
  { Id:"204387", LessonNo:"0",  LevelCode:"3", SubjectCode:"en", LessonTitle:"Writing Informational Texts",                 IsGapClosing:"0", Blueprint:"1", Definitions:10},
  { Id:"203506", LessonNo:"21", LevelCode:"4", SubjectCode:"en", LessonTitle:"Asking and Answering Questions",              IsGapClosing:"0", Blueprint:"1", Definitions:5 },
  { Id:"203477", LessonNo:"32", LevelCode:"3", SubjectCode:"en", LessonTitle:"Using Digital Tools for English",             IsGapClosing:"0", Blueprint:"0", Definitions:6 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ENGLISH (en) — Grados 6-8
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_EN_68 = [
  { Id:"204200", LessonNo:"8",  LevelCode:"6", SubjectCode:"en", LessonTitle:"Supporting Your Opinions",                    IsGapClosing:"0", Blueprint:"1", Definitions:6 },
  { Id:"204199", LessonNo:"7",  LevelCode:"6", SubjectCode:"en", LessonTitle:"Root Words",                                  IsGapClosing:"0", Blueprint:"1", Definitions:5 },
  { Id:"204198", LessonNo:"6",  LevelCode:"7", SubjectCode:"en", LessonTitle:"Courtesy Expressions",                        IsGapClosing:"0", Blueprint:"1", Definitions:4 },
  { Id:"204197", LessonNo:"5",  LevelCode:"7", SubjectCode:"en", LessonTitle:"Composing Sentences",                         IsGapClosing:"0", Blueprint:"1", Definitions:6 },
  { Id:"204196", LessonNo:"4",  LevelCode:"8", SubjectCode:"en", LessonTitle:"Figurative Language in Literature",           IsGapClosing:"0", Blueprint:"1", Definitions:7 },
  { Id:"204195", LessonNo:"3",  LevelCode:"8", SubjectCode:"en", LessonTitle:"Analyzing Arguments",                         IsGapClosing:"0", Blueprint:"1", Definitions:8 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  MATH ENGLISH (mat-en) — Grados K-2
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_MAT_EN = [
  { Id:"205039", LessonNo:"1",  LevelCode:"k", SubjectCode:"mat-en", LessonTitle:"Comparison, Contrast, and Order of Objects", IsGapClosing:"0", Blueprint:"0", Definitions:3 },
  { Id:"205038", LessonNo:"2",  LevelCode:"k", SubjectCode:"mat-en", LessonTitle:"Organizing Data",                            IsGapClosing:"0", Blueprint:"0", Definitions:2 },
  { Id:"205037", LessonNo:"3",  LevelCode:"k", SubjectCode:"mat-en", LessonTitle:"What Time Is It?",                           IsGapClosing:"0", Blueprint:"0", Definitions:3 },
  { Id:"205036", LessonNo:"4",  LevelCode:"k", SubjectCode:"mat-en", LessonTitle:"Addition, Subtraction, and Equal Signs",     IsGapClosing:"0", Blueprint:"0", Definitions:4 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ÍNDICE COMPLETO — todos los grupos indexados por SubjectCode + LevelGroup
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_LESSONS = {
  "sp-k2":    LESSONS_SP_K2,
  "sp-35":    LESSONS_SP_35,
  "mat-sp-35":LESSONS_MAT_35,
  "mat-sp-68":LESSONS_MAT_68,
  "a1-sp":    LESSONS_ALGEBRA,
  "geo-sp":   LESSONS_GEOMETRIA,
  "sci-sp-46":LESSONS_SCI_46,
  "sci-sp-79":LESSONS_SCI_79,
  "bi-sp":    LESSONS_BIO,
  "qu-sp":    LESSONS_QUIMICA,
  "sci-so-46":LESSONS_SS_46,
  "sci-so-78":LESSONS_SS_78,
  "en-k2":    LESSONS_EN_K2,
  "en-35":    LESSONS_EN_35,
  "en-68":    LESSONS_EN_68,
  "mat-en":   LESSONS_MAT_EN,
};

export const FLAT_LESSONS = Object.values(ALL_LESSONS).flat();
