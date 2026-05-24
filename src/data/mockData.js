// ============================================================
// MOCK DATA — Genial Skills Web (Demo de Rediseño)
// Extraído de APIs reales: athenasapi + baseapi
// Mayo 2026
// ============================================================

// -------------------------------------------------------------------
// AUTENTICACIÓN
// Header para baseapi:   { "token": "<JWT>" }
// Header para athenas:   { "Authorization": "Bearer <JWT>" }
// Token storage:         localStorage.getItem('auth').Token
// -------------------------------------------------------------------

// -------------------------------------------------------------------
// USUARIO MAESTRO (de localStorage 'auth')
// -------------------------------------------------------------------
export const mockTeacher = {
  Id: "14482",
  Username: "jgonzalezmaestro",
  Name: "José Maestro",
  Roles: ["teacher"],
  HasProfiles: false,
  HasSubscriptions: false,
  InvitationCode: "W7Y52D1421",
  stats: {
    pendientes: 3,
    mensajesNuevos: 1,
    estudiantesActivos: 12,
    gruposActivos: 2,
  }
};

// -------------------------------------------------------------------
// SUBJECTS — athenasapi.genialskillsweb.com/api/subjects
// 68 materias reales. Campos: Id, Code, Name, LangCode
// -------------------------------------------------------------------
export const mockSubjects = [
  // === ESPAÑOL ===
  { Id: "2",  Code: "sp",       Name: "Español",              Lang: "es" },
  { Id: "4",  Code: "mat-sp",   Name: "Matemáticas",          Lang: "es" },
  { Id: "6",  Code: "sci-sp",   Name: "Ciencias",             Lang: "es" },
  { Id: "7",  Code: "sci-so",   Name: "Estudios Sociales",    Lang: "es" },
  { Id: "8",  Code: "art-sp",   Name: "Bellas Artes",         Lang: "es" },
  { Id: "9",  Code: "edf-sp",   Name: "Educación Física",     Lang: "es" },
  { Id: "10", Code: "sld-sp",   Name: "Salud Escolar",        Lang: "es" },
  { Id: "17", Code: "fi-sp",    Name: "Física",               Lang: "es" },
  { Id: "18", Code: "ca-sp",    Name: "Ciencia Ambiental",    Lang: "es" },
  { Id: "19", Code: "es-sp",    Name: "Estadística",          Lang: "es" },
  { Id: "20", Code: "fpc-sp",   Name: "Preparación al Cálculo", Lang: "es" },
  { Id: "21", Code: "maa-sp",   Name: "Matemáticas Actualizadas", Lang: "es" },
  { Id: "22", Code: "al-sp",    Name: "América Latina: Transformaciones contemporáneas", Lang: "es" },
  { Id: "23", Code: "co-sp",    Name: "Cooperativismo y tendencias de empresarismo", Lang: "es" },
  { Id: "24", Code: "so-sp",    Name: "Sociología: Una perspectiva para la vida", Lang: "es" },
  { Id: "25", Code: "eep-sp",   Name: "Educación en procesos electorales y parlamentarios", Lang: "es" },
  { Id: "26", Code: "ef-sp",    Name: "Educación Financiera",  Lang: "es" },
  { Id: "27", Code: "ge-sp",    Name: "Geografía para la vida", Lang: "es" },
  { Id: "28", Code: "hg-sp",    Name: "Historia General del Caribe", Lang: "es" },
  { Id: "29", Code: "hhmn-sp",  Name: "Huellas del hombre y la mujer negros en la historia de Puerto Rico", Lang: "es" },
  { Id: "30", Code: "ih-sp",    Name: "Investigación Histórica, Social e Historiográfica", Lang: "es" },
  { Id: "31", Code: "pb-sp",    Name: "Principios básicos de Economía", Lang: "es" },
  { Id: "32", Code: "pe-sp",    Name: "Principios de la ética social", Lang: "es" },
  { Id: "33", Code: "ri-sp",    Name: "Las relaciones Internacionales de los Estados Unidos y Puerto Rico", Lang: "es" },
  { Id: "34", Code: "an-sp",    Name: "Antropología",          Lang: "es" },
  { Id: "35", Code: "ds-sp",    Name: "Derecho y sociedad",    Lang: "es" },
  { Id: "36", Code: "em-sp",    Name: "Emprendimiento",        Lang: "es" },
  { Id: "37", Code: "hu-sp",    Name: "Humanidades",           Lang: "es" },
  { Id: "38", Code: "av-sp",    Name: "Artes Visuales",        Lang: "es" },
  { Id: "39", Code: "com-sp",   Name: "Comunicaciones",        Lang: "es" },
  { Id: "40", Code: "da-sp",    Name: "Danza",                 Lang: "es" },
  { Id: "41", Code: "mu-sp",    Name: "Música",                Lang: "es" },
  { Id: "42", Code: "te-sp",    Name: "Teatro",                Lang: "es" },
  { Id: "43", Code: "cap",      Name: "Capacitación",          Lang: "es" },
  { Id: "45", Code: "ct-sp",    Name: "Ciencias Terrestres",   Lang: "es" },
  { Id: "46", Code: "bi-sp",    Name: "Biología",              Lang: "es" },
  { Id: "47", Code: "qu-sp",    Name: "Química",               Lang: "es" },
  { Id: "48", Code: "pa-sp",    Name: "Preálgebra",            Lang: "es" },
  { Id: "49", Code: "a1-sp",    Name: "Álgebra I",             Lang: "es" },
  { Id: "50", Code: "a2",       Name: "Álgebra II",            Lang: "es" },
  { Id: "51", Code: "geo-sp",   Name: "Geometría",             Lang: "es" },
  { Id: "52", Code: "tr-sp",    Name: "Trigonometría",         Lang: "es" },
  { Id: "53", Code: "adl",      Name: "Adquisición de la Lengua", Lang: "es" },
  { Id: "58", Code: "tech-sp",  Name: "Tecnología Educativa",  Lang: "es" },
  // === ENGLISH ===
  { Id: "1",  Code: "en",       Name: "English",               Lang: "en" },
  { Id: "54", Code: "pc-en",    Name: "Precalculus (English)", Lang: "en" },
  { Id: "55", Code: "sci-en",   Name: "Science (English)",     Lang: "en" },
  { Id: "56", Code: "phy-en",   Name: "Physics (English)",     Lang: "en" },
  { Id: "57", Code: "che-en",   Name: "Chemistry (English)",   Lang: "en" },
  { Id: "59", Code: "av-en",    Name: "Visual Arts (English)", Lang: "en" },
  { Id: "60", Code: "com-en",   Name: "Communications (English)", Lang: "en" },
  { Id: "61", Code: "da-en",    Name: "Dance (English)",       Lang: "en" },
  { Id: "62", Code: "te-en",    Name: "Theater (English)",     Lang: "en" },
  { Id: "63", Code: "mu-en",    Name: "Music (English)",       Lang: "en" },
  { Id: "64", Code: "sld-en",   Name: "School Health (English)", Lang: "en" },
  { Id: "65", Code: "edf-en",   Name: "Physical Education (English)", Lang: "en" },
  { Id: "66", Code: "ct-en",    Name: "Earth Sciences (English)", Lang: "en" },
  { Id: "67", Code: "bi-en",    Name: "Biology (English)",     Lang: "en" },
  { Id: "68", Code: "ca-en",    Name: "Environmental Science (English)", Lang: "en" },
  { Id: "69", Code: "pa-en",    Name: "Pre-Algebra (English)", Lang: "en" },
  { Id: "70", Code: "a1-en",    Name: "Algebra I (English)",   Lang: "en" },
  { Id: "71", Code: "a2-en",    Name: "Algebra II (English)",  Lang: "en" },
  { Id: "72", Code: "geo-en",   Name: "Geometry (English)",    Lang: "en" },
  { Id: "73", Code: "tr-en",    Name: "Trigonometry (English)", Lang: "en" },
  { Id: "74", Code: "es-en",    Name: "Statistics (English)",  Lang: "en" },
  { Id: "75", Code: "maa-en",   Name: "Updated Mathematics (English)", Lang: "en" },
  { Id: "76", Code: "mat-en",   Name: "Math (English)",        Lang: "en" },
  { Id: "77", Code: "sci-so-en",Name: "Estudios Sociales (Inglés)", Lang: "en" },
];

// -------------------------------------------------------------------
// GRADES — baseapi/teachersapi/grades
// Campos reales: Id, Code, Name
// -------------------------------------------------------------------
export const mockGrades = [
  { Id: "1",  Code: "k",   Name: "K" },
  { Id: "2",  Code: "1",   Name: "1" },
  { Id: "3",  Code: "2",   Name: "2" },
  { Id: "4",  Code: "3",   Name: "3" },
  { Id: "5",  Code: "4",   Name: "4" },
  { Id: "6",  Code: "5",   Name: "5" },
  { Id: "7",  Code: "6",   Name: "6" },
  { Id: "8",  Code: "7",   Name: "7" },
  { Id: "9",  Code: "8",   Name: "8" },
  { Id: "10", Code: "9",   Name: "9" },
  { Id: "11", Code: "10",  Name: "10" },
  { Id: "12", Code: "11",  Name: "11" },
  { Id: "13", Code: "12",  Name: "12" },
];

// -------------------------------------------------------------------
// PLANNING — estructura real de baseapi/teachersapi/planning/detail/:id
// -------------------------------------------------------------------
export const mockPlanning = {
  TeacherPlanModel: {
    Id: "1248",
    Name: "Test grupo",
    SubjectName: "Ciencias",
    SubjectCode: "sci-sp",
    LevelCode: "5",
    PeriodId: "73",
    Available: "1",
    Opened: "1",
    OpenDate: "05/20/2026 00:00:00",
    CloseDate: "05/26/2026 00:00:00",
    WeekNumber: "210",
    UserId: "14482",
  },
  LessonAttachedModelList: [],     // Lecciones añadidas al plan
  QuizzesAttachedModelList: [],    // Quizzes añadidos al plan
  GroupsAttachedList: [
    {
      TeacherPlanGroupId: "101",
      GroupId: "482",
      GroupName: "Sexto-Matemática"
    }
  ],
  AcademicPeriodFullDetail: {
    AcademicPeriods: [
      {
        Id: "73",
        PeriodNumber: "4",
        PeriodFrom: "09/05/2023 00:00:00",
        PeriodTo: "05/31/2030 00:00:00",
      }
    ]
  }
};

// -------------------------------------------------------------------
// LESSON — estructura real de baseapi/teachersapi/lessons/:id
// -------------------------------------------------------------------
export const mockLesson = {
  Id: "205105",
  LessonNo: "3",
  LevelCode: "k",
  SubjectCode: "sp",
  LessonTitle: "C5 Identifica el inicio y el cierre de una oración",
  LessonImg: null,
  HasAudioRecorder: "0",
  IsDynamic: null,
  IsGapClosing: "0",
  Blueprint: "0",
  CreatedAt: "3/16/2026 8:11:59 PM",
  UpdatedAt: "3/25/2026 2:09:28 PM"
};

// -------------------------------------------------------------------
// PLANNINGS LIST — baseapi/teachersapi/planning/user/created
// -------------------------------------------------------------------
export const mockPlanningsList = [
  {
    PlanId: "1248",
    PlanName: "Test grupo",
    TeacherId: "14482",
    PlanAvailable: true,
    SubjectCode: "sci-sp",
    LevelCode: "5",
    SubjectName: "Ciencias",
    PeriodId: "73",
    IsPlanOpen: true,
    CreatedAt: "05/21/2026 01:39:37",
    OpenDate: "05/20/2026 00:00:00",
    CloseDate: "05/26/2026 00:00:00",
    WeekNumber: 0,
  }
];

// -------------------------------------------------------------------
// GRUPOS (mock enriquecido — grupos reales estaban vacíos en este user)
// Estructura basada en baseapi/teachersapi/teacher-groups/0/50
// -------------------------------------------------------------------
export const mockGroups = [
  {
    GroupId: "482",
    GroupName: "Sexto-Matemática",
    SubjectCode: "mat-sp",
    LevelCode: "6",
    StudentCount: 14,
    Active: true,
  },
  {
    GroupId: "483",
    GroupName: "Quinto-Ciencias",
    SubjectCode: "sci-sp",
    LevelCode: "5",
    StudentCount: 18,
    Active: true,
  },
  {
    GroupId: "484",
    GroupName: "Cuarto-Español",
    SubjectCode: "sp",
    LevelCode: "4",
    StudentCount: 12,
    Active: true,
  }
];

// -------------------------------------------------------------------
// ACTIVIDAD RECIENTE (mock para el dashboard)
// -------------------------------------------------------------------
export const mockRecentActivity = [
  { texto: "Grupo Sexto-Matemática completó Lección 12", tiempo: "hace 1h", tipo: "logro" },
  { texto: "Carlos R. entregó tarea de Ciencias", tiempo: "hace 3h", tipo: "entrega" },
  { texto: "Nuevo estudiante unido al Grupo Quinto-Ciencias", tiempo: "ayer", tipo: "nuevo" },
  { texto: "Plan 'Test grupo' creado con IA", tiempo: "ayer", tipo: "ia" },
  { texto: "3 asignaciones pendientes de corrección", tiempo: "hace 2 días", tipo: "alerta" },
];

// -------------------------------------------------------------------
// PERÍODOS ACADÉMICOS (del AcademicPeriodFullDetail real)
// -------------------------------------------------------------------
export const mockAcademicPeriods = [
  { Id: "73", PeriodNumber: "4", Label: "Período 4", PeriodFrom: "09/05/2023", PeriodTo: "05/31/2030" }
];

// -------------------------------------------------------------------
// API CONFIG — cómo hacer las llamadas reales
// -------------------------------------------------------------------
export const API_CONFIG = {
  athenasBase: "https://athenasapi.genialskillsweb.com",
  baseApi: "https://baseapi.genialskillsweb.com",
  authHeaderAthenas: (token) => ({ "Authorization": `Bearer ${token}` }),
  authHeaderBase:    (token) => ({ "token": token }),
  endpoints: {
    subjects:      "/api/subjects",                            // athenas
    grades:        "/teachersapi/grades",                      // baseapi
    groups:        "/teachersapi/teacher-groups/0/50",         // baseapi
    plannings:     "/teachersapi/planning/user/created",       // baseapi
    planningDetail:(id) => `/teachersapi/planning/detail/${id}`, // baseapi
    lessonDetail:  (id) => `/teachersapi/lessons/${id}`,       // baseapi
    lessonsAdvance:"/teachersapi/lessons/advance",             // baseapi
    pendingTotal:  "/teachersapi/homework/teacher/corrections/pendings/total", // baseapi
    messagesUnread:"/messagesapi/messages/unreads",            // baseapi
    createPlanning:"/teachersapi/planning/create",             // baseapi POST
  }
};
