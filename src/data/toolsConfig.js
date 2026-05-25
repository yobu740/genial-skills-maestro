/* Tool configs — fields, prompts, and default models for each AI tool.
   Models are OpenRouter slugs. Swap freely from the modal's model selector. */

const MODELS = [
  { id: 'anthropic/claude-sonnet-4.5',   label: 'Claude Sonnet 4.5 — balanceado',   tier: 'premium'  },
  { id: 'anthropic/claude-opus-4.1',     label: 'Claude Opus 4.1 — máxima calidad', tier: 'premium'  },
  { id: 'anthropic/claude-haiku-4.5',    label: 'Claude Haiku 4.5 — rápido',        tier: 'fast'     },
  { id: 'openai/gpt-4o',                 label: 'GPT-4o — preciso',                 tier: 'premium'  },
  { id: 'openai/gpt-4o-mini',            label: 'GPT-4o mini — económico',          tier: 'fast'     },
  { id: 'google/gemini-2.5-flash',       label: 'Gemini 2.5 Flash — rápido',        tier: 'fast'     },
  { id: 'google/gemini-2.5-pro',         label: 'Gemini 2.5 Pro — razonamiento',    tier: 'premium'  },
];

const GRADOS = ['K', '1ro', '2do', '3ro', '4to', '5to', '6to', '7mo', '8vo', '9no', '10mo', '11mo', '12mo'];
const MATERIAS = ['Matemáticas', 'Ciencias', 'Español / Lenguaje', 'Inglés / ELA', 'Estudios Sociales', 'Arte', 'Música', 'Educación Física'];

const SYSTEM_TEACHER = `Eres un asistente pedagógico experto para maestros de escuela en Puerto Rico. Respondes siempre en español claro y profesional, alineado al Departamento de Educación de Puerto Rico y a estándares comunes (CCSS / NGSS cuando aplique). Genera contenido directamente utilizable: estructurado en markdown, con encabezados, tablas cuando ayuden, y vocabulario apropiado al grado solicitado. No incluyas disclaimers innecesarios. Cuando uses notación matemática (fracciones, exponentes, ecuaciones, raíces, sumatorias, matrices, etc.) escribe SIEMPRE en LaTeX: usa $...$ para fórmulas inline y $$...$$ para bloques destacados. Ejemplos: $\frac{3}{4}$, $x^2 + 2x + 1$, $$\frac{a}{b} + \frac{c}{d} = \frac{ad+bc}{bd}$$. NUNCA escribas fracciones como "3/4" en texto plano cuando representen un concepto matemático.`;

// Append this to system prompts for tools that should generate illustrations.
// The frontend scans for [IMAGE: ...] tags after streaming and replaces them
// with real generated images via Replicate FLUX-schnell.
const IMAGE_INSTRUCTIONS = `

## Generación de imágenes (IMPORTANTE — el sistema las renderiza automáticamente)
Tienes la capacidad de generar imágenes. Cuando un concepto se beneficie visualmente, inserta un tag en línea con el siguiente formato exacto:

[IMAGE: <prompt detallado en INGLÉS describiendo qué mostrar, estilo, colores, edad apropiada>]

El sistema reemplaza cada tag por la imagen real generada. Reglas:
- El prompt va en INGLÉS (FLUX entiende mejor).
- Sé específico: tema + sujeto + ambiente + estilo + colores + audiencia.
- Estilo recomendado: "children's book illustration, soft colors, age-appropriate, clear, friendly".
- Para diagramas educativos: "labeled educational diagram, clean lines, simple visual style".
- NO escribas la palabra "[IMAGE:" en español ni con otra puntuación — debe coincidir exacta.
- Pon imágenes donde realmente aporten — no inflar (típicamente 1-3 por documento, máximo 5).

Ejemplos:
[IMAGE: A colorful children's book illustration of a Puerto Rican coquí frog sitting on a wet leaf at night, watercolor style, vivid greens and blues, fireflies in background]
[IMAGE: A labeled educational diagram showing the parts of a plant cell — nucleus, cytoplasm, cell wall, chloroplasts — simple flat style with clear Spanish labels, white background]`;

const TOOLS = {
  /* ─── Planificación ─── */
  'Plan My Lesson': {
    category: 'planificacion',
    title: 'Plan My Lesson',
    useFewshot: true,
    subtitle: 'Genera un plan de lección completo según materia, grado y estándar.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'materia',  label: 'Materia',           type: 'select',  options: MATERIAS, required: true },
      { name: 'grado',    label: 'Grado',             type: 'select',  options: GRADOS, default: '5to', required: true },
      { name: 'tema',     label: 'Tema de la lección', type: 'text',   placeholder: 'Ej: Fracciones equivalentes', required: true },
      { name: 'duracion', label: 'Duración (min)',    type: 'number',  default: 60 },
      { name: 'estandar', label: 'Estándar (opcional)', type: 'text',  placeholder: 'CCSS.MATH.4.NF.A.1' },
          { name: 'estandares', type: 'standards', subjectField: 'materia', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER + IMAGE_INSTRUCTIONS,
    buildPrompt: (f) => `Crea un plan de lección detallado para ${f.materia}, ${f.grado} grado, sobre "${f.tema}".
Duración aproximada: ${f.duracion || 60} minutos.${f.estandar ? `\nEstándar a cubrir: ${f.estandar}` : ''}

Si el tema se beneficia visualmente (ciencias, matemáticas, arte, conceptos espaciales), incluye 1-2 tags [IMAGE: prompt en inglés] como apoyo (gancho de inicio o ilustración de concepto clave).

Incluye estas secciones en markdown:
1. **Objetivos de aprendizaje** (2-3, observables y medibles)
2. **Estándares alineados**
3. **Materiales necesarios**
4. **Vocabulario clave**
5. **Inicio / activación** (5-10 min)
6. **Desarrollo / instrucción guiada** (con pasos numerados)
7. **Práctica independiente o grupal**
8. **Cierre y assessment formativo**
9. **Diferenciación**: una idea para ELL, una para SPED, una para estudiantes adelantados
10. **Tarea / extensión**`,
  },

  'STEM Unit Planner': {
    category: 'planificacion',
    title: 'STEM Unit Planner',
    useFewshot: true,
    subtitle: 'Diseña una unidad STEM completa con proyecto integrador.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'grado',    label: 'Grado',       type: 'select', options: GRADOS, default: '5to', required: true },
      { name: 'tema',     label: 'Tema central', type: 'text',  placeholder: 'Ej: Ecosistemas de Puerto Rico', required: true },
      { name: 'semanas',  label: 'Duración (semanas)', type: 'number', default: 3 },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER + IMAGE_INSTRUCTIONS,
    buildPrompt: (f) => `Diseña una unidad STEM de ${f.semanas || 3} semanas para ${f.grado} grado sobre "${f.tema}".
Integra ciencia, tecnología, ingeniería y matemáticas. Incluye 1-2 tags [IMAGE: prompt en inglés] como ilustraciones del tema central o del proyecto integrador. Continúa:
- **Pregunta esencial** que guíe la unidad
- **Cronograma semanal** (tabla en markdown: Semana | Foco | Actividades)
- **Proyecto integrador final** con criterios de evaluación
- **Conexiones interdisciplinarias** específicas
- **Conexión con Puerto Rico** (contexto local)
- **Recursos sugeridos** (gratuitos, en español si es posible)`,
  },

  'Adaptar Lección': {
    category: 'planificacion',
    title: 'Adaptar Lección',
    subtitle: 'Adapta una lección existente para estudiantes ELL o con necesidades especiales.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'leccion',   label: 'Pega la lección original', type: 'textarea', placeholder: 'Pega aquí el plan o describe la lección…', required: true, rows: 8 },
      { name: 'perfil',    label: 'Perfil del estudiante',    type: 'select', options: ['ELL nivel principiante', 'ELL nivel intermedio', 'SPED — dislexia', 'SPED — TDAH', 'SPED — espectro autista', 'Estudiante avanzado'], required: true },
      { name: 'grado',     label: 'Grado', type: 'select', options: GRADOS, default: '5to' },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER + IMAGE_INSTRUCTIONS,
    buildPrompt: (f) => `Adapta esta lección para un estudiante con perfil: ${f.perfil} (${f.grado} grado).

Lección original:
"""
${f.leccion}
"""

Devuelve:
1. **Resumen de adaptaciones aplicadas** (lista breve)
2. **Lección adaptada completa** — reescrita, no solo notas
3. **Acomodaciones específicas** (tiempo, formato, presentación, respuesta)
4. **Sugerencias de scaffolding** concretas
5. **Cómo evaluar** sin penalizar la condición

Si el perfil del estudiante se beneficia de apoyo visual (ELL principiante, SPED dislexia, espectro autista), incluye 1-2 tags [IMAGE: prompt en inglés] como scaffolding visual de los conceptos clave.`,
  },

  'Objetivos de Lenguaje': {
    category: 'planificacion',
    title: 'Objetivos de Lenguaje',
    subtitle: 'Genera metas lingüísticas (ELL) para una lección.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'contenido', label: 'Objetivo de contenido de la lección', type: 'textarea', placeholder: 'Ej: Los estudiantes explicarán las características de los ecosistemas.', required: true, rows: 4 },
      { name: 'grado',     label: 'Grado',  type: 'select', options: GRADOS, default: '5to' },
      { name: 'nivel_ell', label: 'Nivel del estudiante ELL', type: 'select', options: ['Entrante', 'Emergente', 'En desarrollo', 'Expansión', 'Puente'], default: 'En desarrollo' },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER + ' Eres experto en WIDA y desarrollo del lenguaje académico.',
    buildPrompt: (f) => `Genera objetivos de lenguaje alineados al objetivo de contenido, para ${f.grado} grado, estudiante ELL nivel ${f.nivel_ell}.

Objetivo de contenido: "${f.contenido}"

Devuelve:
1. **Objetivo de lenguaje principal** (1 frase, verbo lingüístico explícito: describir, comparar, justificar…)
2. **Funciones del lenguaje** que se practicarán
3. **Vocabulario académico clave** (Tier 2 y Tier 3) — tabla
4. **Estructuras sintácticas / sentence frames** específicas al nivel del estudiante
5. **Cómo evidenciar el objetivo lingüístico** durante la clase
6. **Soportes (scaffolds) recomendados** para este nivel`,
  },

  /* ─── Diferenciación ─── */
  'Estrategia de Grupos': {
    category: 'diferenciacion',
    title: 'Estrategia de Grupos',
    subtitle: 'Sugiere cómo agrupar estudiantes según niveles y objetivo.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [
      { name: 'total',     label: 'Cantidad total de estudiantes', type: 'number', default: 24, required: true },
      { name: 'objetivo',  label: 'Objetivo / actividad', type: 'text', placeholder: 'Ej: Práctica de resolución de problemas con fracciones', required: true },
      { name: 'niveles',   label: 'Distribución de niveles', type: 'text', placeholder: 'Ej: 6 avanzados, 12 en nivel, 6 con soporte', required: true },
      { name: 'tipo',      label: 'Tipo de agrupación', type: 'select', options: ['Homogénea (mismo nivel)', 'Heterogénea (niveles mezclados)', 'Por interés', 'Aleatoria estratégica'], default: 'Heterogénea (niveles mezclados)' },
    ],
    system: SYSTEM_TEACHER,
    buildPrompt: (f) => `Diseña una estrategia de agrupación para ${f.total} estudiantes.
Objetivo: ${f.objetivo}
Niveles: ${f.niveles}
Tipo solicitado: ${f.tipo}

Devuelve:
1. **Justificación pedagógica** del tipo de agrupación (3-4 líneas)
2. **Estructura de grupos**: cantidad, tamaño y composición sugerida
3. **Rol dentro de cada grupo** (facilitador, recolector de evidencia, etc.)
4. **Tarea diferenciada por grupo** si aplica
5. **Cómo monitorear y dar feedback** al circular`,
  },

  'Diferenciar Contenido': {
    category: 'diferenciacion',
    title: 'Diferenciar Contenido',
    subtitle: 'Crea tres versiones del mismo contenido para distintos niveles.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'tema',    label: 'Tema o concepto', type: 'text', placeholder: 'Ej: Sistema solar', required: true },
      { name: 'grado',   label: 'Grado',           type: 'select', options: GRADOS, default: '5to' },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER + IMAGE_INSTRUCTIONS + `

Para esta herramienta específicamente: el Nivel 1 (Soporte) SIEMPRE debe incluir un tag [IMAGE: ...] como apoyo visual. Opcionalmente uno adicional en Nivel 2 o 3 si aporta.`,
    buildPrompt: (f) => `Para "${f.tema}" (${f.grado} grado), produce tres versiones del mismo contenido:

### Nivel 1 — Soporte (bajo dominio)
Texto simplificado + vocabulario clave + **un tag [IMAGE: prompt detallado en inglés] como apoyo visual indispensable**.

### Nivel 2 — En nivel
Texto al grado esperado + actividad de aplicación. Puedes incluir un [IMAGE: ...] si suma.

### Nivel 3 — Extensión (avanzado)
Texto enriquecido + pregunta de análisis crítico + tarea de investigación.

Cada nivel: 150-250 palabras, terminando con 2-3 preguntas de comprensión apropiadas al nivel.`,
  },

  'Diferenciar Proceso': {
    category: 'diferenciacion',
    title: 'Diferenciar Proceso',
    subtitle: 'Adapta cómo los estudiantes interactúan con el contenido.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'leccion',  label: 'Lección o concepto',          type: 'textarea', placeholder: 'Ej: Comprensión de la fotosíntesis', required: true, rows: 4 },
      { name: 'grado',    label: 'Grado',                        type: 'select',  options: GRADOS, default: '5to' },
      { name: 'estilos',  label: 'Estilos de aprendizaje en clase', type: 'text', placeholder: 'Ej: visual, auditivo, kinestésico, lectura/escritura', default: 'visual, auditivo, kinestésico, lectura/escritura' },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER,
    buildPrompt: (f) => `Diferencia el **proceso** (cómo aprenden) para ${f.grado} grado, lección: "${f.leccion}".
Estilos a cubrir: ${f.estilos}.

Para cada estilo, propone:
- **Actividad concreta** que conecta con esa modalidad
- **Materiales necesarios**
- **Producto o evidencia** del aprendizaje
- **Tiempo estimado**

Cierra con una **mini-rutina de elección** donde el estudiante seleccione la actividad que más le motive.`,
  },

  'Diferenciar Producto': {
    category: 'diferenciacion',
    title: 'Diferenciar Producto',
    subtitle: 'Crea opciones para que el estudiante demuestre lo aprendido.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'objetivo', label: 'Objetivo de aprendizaje a demostrar', type: 'textarea', placeholder: 'Ej: Explicar las causas y efectos de la deforestación', required: true, rows: 4 },
      { name: 'grado',    label: 'Grado', type: 'select', options: GRADOS, default: '5to' },
      { name: 'cantidad', label: 'Cantidad de opciones', type: 'number', default: 6 },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER,
    buildPrompt: (f) => `Diseña ${f.cantidad || 6} **opciones de producto final** que demuestran el mismo objetivo, para ${f.grado} grado.
Objetivo: "${f.objetivo}"

Tabla markdown con: **Opción | Descripción | Habilidades que demuestra | Tiempo | Nivel de reto (★)**

Las opciones deben variar en modalidad (escrito, oral, visual, multimedia, performativo, kinestésico) y nivel de dificultad. Todas evaluables con la misma rúbrica.

Al final añade un **párrafo de uso** explicando cómo presentar el choice board al estudiante.`,
  },

  /* ─── Evaluación ─── */
  'Crear Rúbrica': {
    category: 'evaluacion',
    title: 'Crear Rúbrica',
    subtitle: 'Genera una rúbrica analítica para cualquier tarea o proyecto.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'tarea',    label: 'Tarea o proyecto a evaluar', type: 'textarea', placeholder: 'Ej: Ensayo argumentativo sobre el reciclaje en mi comunidad', required: true, rows: 4 },
      { name: 'grado',    label: 'Grado',     type: 'select', options: GRADOS, default: '5to' },
      { name: 'niveles',  label: 'Niveles',   type: 'select', options: ['3 niveles', '4 niveles', '5 niveles'], default: '4 niveles' },
      { name: 'criterios', label: 'Criterios a incluir (opcional)', type: 'text', placeholder: 'Ej: contenido, organización, gramática' },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER,
    buildPrompt: (f) => `Crea una rúbrica analítica para ${f.grado} grado.
Tarea: "${f.tarea}"
Estructura: ${f.niveles}.${f.criterios ? `\nCriterios solicitados: ${f.criterios}` : ''}

Formato: tabla markdown con criterios en filas y niveles en columnas. Cada celda debe describir el desempeño observable (no solo "bueno/malo"). Antes de la tabla incluye un párrafo breve indicando cómo usar la rúbrica. Al final añade un total de puntos sugerido y cómo convertirlo a porcentaje.`,
  },

  'Preguntas DOK': {
    category: 'evaluacion',
    title: 'Preguntas DOK',
    subtitle: 'Genera preguntas por nivel de profundidad cognitiva (Webb).',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'tema',  label: 'Tema o lectura', type: 'textarea', placeholder: 'Pega el texto o describe el tema…', required: true, rows: 5 },
      { name: 'grado', label: 'Grado', type: 'select', options: GRADOS, default: '5to' },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER,
    buildPrompt: (f) => `Para ${f.grado} grado, sobre el siguiente tema/texto, genera **3 preguntas por cada nivel DOK** (Webb):

Tema:
"""
${f.tema}
"""

### DOK 1 — Recordar (3 preguntas)
### DOK 2 — Aplicar / habilidades (3 preguntas)
### DOK 3 — Pensamiento estratégico (3 preguntas)
### DOK 4 — Pensamiento extendido (3 preguntas)

Cada pregunta debe ser apropiada al grado y al final añade una clave de respuestas breve.`,
  },

  'Examen de Matemáticas': {
    category: 'evaluacion',
    title: 'Examen de Matemáticas',
    subtitle: 'Crea una prueba matemática con clave de respuestas.',
    defaultModel: 'openai/gpt-4o',
    fields: [

      { name: 'grado',     label: 'Grado',     type: 'select', options: GRADOS, default: '5to' },
      { name: 'tema',      label: 'Tema',      type: 'text', placeholder: 'Ej: Multiplicación de fracciones', required: true },
      { name: 'cantidad',  label: 'Cantidad de problemas', type: 'number', default: 10 },
      { name: 'tipo',      label: 'Formato',   type: 'select', options: ['Selección múltiple', 'Respuesta corta', 'Mixto (selección + procedimiento)'], default: 'Mixto (selección + procedimiento)' },
          { name: 'estandares', type: 'standards', subject: 'Matemáticas', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER + IMAGE_INSTRUCTIONS + `

Para esta herramienta de matemáticas específicamente:
- Usa LaTeX entre $...$ inline y $$...$$ para bloques (fracciones, exponentes, ecuaciones). Para fracciones SIEMPRE $\\frac{a}{b}$, nunca "a/b" en texto plano.
- Las imágenes [IMAGE: ...] son útiles para CONTEXTO VISUAL de problemas (no para mediciones precisas). Usa estilo: "math textbook illustration, clean, friendly, age-appropriate, single concept per image, white background".
- Buenos usos de imagen en exámenes de matemáticas:
  • Problemas verbales con contexto (3 niños compartiendo pizza, productos en mercado, etc.)
  • Modelos visuales de fracciones (barras, círculos divididos, modelos de área)
  • Geometría conceptual (figuras 3D, simetrías, transformaciones)
  • Patrones y secuencias visuales
  • Coordenadas y planos cartesianos (pero las medidas exactas siempre en LaTeX)
- NO uses imagen para: ángulos exactos en grados, mediciones precisas, números específicos en gráficas — para eso describe con LaTeX o ASCII art.
- Idealmente 2-4 imágenes por examen de 10 problemas, en los problemas que más se benefician visualmente.`,
    buildPrompt: (f) => `Crea un examen de matemáticas para ${f.grado} grado sobre "${f.tema}".
Cantidad: ${f.cantidad || 10} problemas.
Formato: ${f.tipo}.

Incluye:
1. **Instrucciones para el estudiante** (1-2 líneas)
2. **Problemas numerados** con dificultad progresiva (fácil → difícil)
   - Para los problemas que se beneficien de contexto visual (verbales, geometría conceptual, fracciones, patrones), incluye un tag [IMAGE: prompt en inglés] como apoyo. Mira las reglas en el system prompt.
3. Espacio sugerido para trabajo cuando aplique
4. **--- HOJA DE RESPUESTAS ---** al final con explicación paso a paso de cada problema, no solo la respuesta

Para que pueda convertirse en interactivo, usa esta estructura clara:
- Cada problema debe comenzar con "1.", "2.", "3.", etc.
- Si es selección múltiple, cada opción debe estar como "A.", "B.", "C.", "D."
- En la hoja de respuestas, incluye la clave como "1. A", "2. C", etc.
- Evita poner la numeración dentro de tablas.`,
  },

  'Creador de Assessments': {
    category: 'evaluacion',
    title: 'Creador de Assessments',
    subtitle: 'Genera assessments formativos, sumativos o de desempeño para cualquier materia.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [
      { name: 'materia',  label: 'Materia',  type: 'select', options: MATERIAS, required: true },
      { name: 'grado',    label: 'Grado',    type: 'select', options: GRADOS, default: '5to', required: true },
      { name: 'tema',     label: 'Tema o unidad', type: 'text', placeholder: 'Ej: Ecosistemas y cadenas alimentarias', required: true },
      { name: 'tipo',     label: 'Tipo de assessment', type: 'select', options: [
        'Formativo (durante la unidad)',
        'Sumativo (final de unidad)',
        'De desempeño (performance-based)',
        'Exit ticket (5-10 min)',
        'Quiz corto',
      ], default: 'Formativo (durante la unidad)', required: true },
      { name: 'cantidad', label: 'Cantidad de ítems', type: 'number', default: 10 },
      { name: 'formato',  label: 'Formato de ítems', type: 'select', options: [
        'Selección múltiple', 'Respuesta corta', 'Abierto / ensayo', 'Performance task', 'Mixto',
      ], default: 'Mixto' },
      { name: 'estandares', type: 'standards', subjectField: 'materia', gradeField: 'grado' },
    ],
    system: SYSTEM_TEACHER + `

Para esta herramienta:
- Construye un assessment alineado a estándares DEPR (cita códigos cuando los selecciones).
- Variedad de niveles cognitivos (DOK 1-3 mínimo; DOK 4 en assessments sumativos).
- Para Performance task: rúbrica analítica al final (criterios × niveles).
- Para Exit ticket: máximo 3-5 items, foco en el objetivo del día.
- Formato compatible con assessment interactivo: items numerados (1., 2., 3.), opciones (A., B., C., D.) y hoja de respuestas con clave "1. A", "2. C", etc.`,
    buildPrompt: (f) => `Crea un assessment de ${f.materia} para ${f.grado} grado sobre "${f.tema}".
Tipo: ${f.tipo}
Cantidad: ${f.cantidad || 10} ítems
Formato: ${f.formato}

Incluye:
1. **Título** del assessment + propósito breve (1 línea)
2. **Instrucciones para el estudiante** (2-3 líneas, claras al grado)
3. **Estándares medidos** (lista con códigos DEPR + descripción breve)
4. **Items numerados** con dificultad progresiva
5. ${f.formato === 'Performance task' ? '**Rúbrica analítica** (4 niveles × criterios)' : '**Hoja de respuestas / clave** al final con explicación breve por item'}
6. **Nota para el maestro**: cómo interpretar resultados + qué destreza mide cada bloque`,
  },

  'Pruebas Diagnósticas': {
    category: 'evaluacion',
    title: 'Pruebas Diagnósticas',
    subtitle: 'Crea pre-tests para identificar conocimientos previos y brechas antes de una unidad.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [
      { name: 'materia',  label: 'Materia',  type: 'select', options: MATERIAS, required: true },
      { name: 'grado',    label: 'Grado',    type: 'select', options: GRADOS, default: '5to', required: true },
      { name: 'unidad',   label: 'Unidad o tema próximo a enseñar', type: 'text', placeholder: 'Ej: Fracciones equivalentes (lo que voy a comenzar)', required: true },
      { name: 'momento',  label: 'Momento del año', type: 'select', options: [
        'Inicio del año escolar',
        'Antes de comenzar una unidad nueva',
        'Mitad de año (revisión global)',
        'Identificación de brechas (gap-closing)',
      ], default: 'Antes de comenzar una unidad nueva', required: true },
      { name: 'cantidad', label: 'Cantidad de ítems', type: 'number', default: 12 },
      { name: 'estandares', type: 'standards', subjectField: 'materia', gradeField: 'grado' },
    ],
    system: SYSTEM_TEACHER + `

Para esta herramienta de prueba diagnóstica:
- El propósito NO es calificar — es identificar qué saben los estudiantes ANTES de enseñar.
- Mezcla items de **prerequisitos** (lo que deben saber del grado anterior / unidad anterior) con items que **anticipan** el contenido nuevo (sin esperar dominio).
- Vocabulario claro al grado, instrucciones breves.
- Variedad: selección múltiple para diagnosticar concepto, respuesta corta para diagnosticar proceso, una pregunta abierta para diagnosticar comprensión.
- AL FINAL incluye una **guía interpretativa** con 3 niveles:
  • Listo (80%+) → puede empezar la unidad sin scaffolding
  • Parcial (50-79%) → necesita repaso focalizado de X conceptos
  • Necesita base (≤49%) → requiere intervención previa o adaptación
- Y una sección "**Recomendaciones de diferenciación**" según los resultados.
- Formato compatible con assessment interactivo (items 1./2./3., opciones A./B./C./D., clave en hoja de respuestas).`,
    buildPrompt: (f) => `Crea una **prueba diagnóstica** de ${f.materia} para ${f.grado} grado.
Unidad/tema próximo: "${f.unidad}"
Momento: ${f.momento}
Cantidad: ${f.cantidad || 12} ítems

Estructura:
1. **Título** + propósito diagnóstico (1-2 líneas: qué quieres descubrir)
2. **Mensaje al estudiante** que reduzca ansiedad: "Esto NO cuenta para nota, es para ayudarme a planificar mejor las clases."
3. **Bloque A — Prerrequisitos** (4-6 ítems): lo que necesitan dominar del grado/unidad previa para entender lo nuevo
4. **Bloque B — Anticipación** (resto de ítems): items que tocan el contenido NUEVO. No esperes dominio — es para ver chispas de comprensión.
5. **Hoja de respuestas / clave** con explicación breve de cada respuesta
6. **Guía interpretativa**: tabla de 3 niveles de preparación (Listo / Parcial / Necesita base) con qué hacer en cada caso
7. **Recomendaciones de diferenciación** específicas según los conceptos donde más estudiantes podrían fallar
8. **Tabla de seguimiento** (markdown) para que el maestro registre resultados por estudiante`,
  },

  'Feedback Personalizado': {
    category: 'evaluacion',
    title: 'Feedback Personalizado',
    subtitle: 'Genera retroalimentación individual constructiva.',
    defaultModel: 'openai/gpt-4o-mini',
    fields: [
      { name: 'estudiante', label: 'Nombre del estudiante', type: 'text', placeholder: 'María', required: true },
      { name: 'trabajo',    label: 'Resumen del trabajo entregado', type: 'textarea', placeholder: 'Ej: ensayo sobre el reciclaje, 2 páginas, buena estructura pero gramática débil', required: true, rows: 5 },
      { name: 'tono',       label: 'Tono', type: 'select', options: ['Cálido y motivador', 'Directo y profesional', 'Coaching (preguntas guía)'], default: 'Cálido y motivador' },
    ],
    system: SYSTEM_TEACHER,
    buildPrompt: (f) => `Escribe feedback personalizado para ${f.estudiante}.
Trabajo entregado: ${f.trabajo}
Tono solicitado: ${f.tono}.

Estructura el feedback en:
- **Lo que hiciste muy bien** (2-3 puntos específicos)
- **Para tu próxima entrega** (2 puntos concretos y accionables, no genéricos)
- **Reto para crecer** (1 desafío opcional para empujarle un poco más)

Dirígete al estudiante en segunda persona. Evita frases vacías como "buen trabajo en general".`,
  },

  'Choice Board': {
    category: 'evaluacion',
    title: 'Choice Board',
    subtitle: 'Tablero 3x3 (Tic-Tac-Toe) de actividades diferenciadas.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'tema',  label: 'Tema o unidad', type: 'text', placeholder: 'Ej: La Revolución Industrial', required: true },
      { name: 'grado', label: 'Grado', type: 'select', options: GRADOS, default: '5to' },
      { name: 'instrucciones', label: 'Reglas (opcional)', type: 'text', placeholder: 'Ej: completar 3 en línea', default: 'Completar 3 actividades en línea (horizontal, vertical o diagonal)' },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER,
    buildPrompt: (f) => `Crea un **Choice Board (Tic-Tac-Toe 3x3)** para ${f.grado} grado sobre "${f.tema}".

Estructura:
1. Tabla markdown 3x3 con una actividad por celda
2. La fila central es **obligatoria** (debe haber sí o sí una actividad medular ahí)
3. Cada actividad tiene: **título corto en negrita**, descripción de 1-2 líneas, y un **icono unicode** que la represente
4. Variedad: combina escribir, dibujar/crear, investigar, presentar, resolver, conectar con la vida real
5. Distintos niveles DOK (mínimo 1-2 actividades DOK 3+)

Después de la tabla añade:
- **Instrucciones para el estudiante** (${f.instrucciones})
- **Rúbrica simple** (3 criterios × 3 niveles)`,
  },

  /* ─── Lectura ─── */
  'Lectura por Nivel': {
    category: 'lectura',
    title: 'Lectura por Nivel',
    subtitle: 'Crea un texto de lectura adaptado al grado.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'tema',     label: 'Tema',     type: 'text', placeholder: 'Ej: El coquí puertorriqueño', required: true },
      { name: 'grado',    label: 'Grado',    type: 'select', options: GRADOS, default: '5to' },
      { name: 'longitud', label: 'Longitud', type: 'select', options: ['Corta (~150 palabras)', 'Media (~300 palabras)', 'Larga (~500 palabras)'], default: 'Media (~300 palabras)' },
      { name: 'genero',   label: 'Género',   type: 'select', options: ['Informativo', 'Narrativo', 'Descriptivo', 'Persuasivo'], default: 'Informativo' },
          { name: 'estandares', type: 'standards', subject: 'Español', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER + IMAGE_INSTRUCTIONS + `

Para esta herramienta específicamente: incluye SIEMPRE una imagen de portada justo después del título (un solo [IMAGE: ...] tag por lectura, no más).`,
    buildPrompt: (f) => `Crea un texto de lectura ${f.genero.toLowerCase()} para ${f.grado} grado sobre "${f.tema}".
Longitud: ${f.longitud}.

Estructura:
1. **Título** atractivo
2. **Imagen de portada** — un tag [IMAGE: prompt en inglés describiendo el tema visualmente]
3. **Texto** con vocabulario y sintaxis apropiados al grado
4. **Vocabulario clave** (5-7 palabras, definidas en lenguaje simple)
5. **3 preguntas literales**, **2 inferenciales**, **1 crítica**
6. **Clave de respuestas** al final

Cuando sea posible, incluye una conexión con la cultura, geografía o historia de Puerto Rico.`,
  },

  'Vocabulario Académico': {
    category: 'lectura',
    title: 'Vocabulario Académico',
    subtitle: 'Lista de vocabulario por temática con definiciones y uso.',
    defaultModel: 'openai/gpt-4o-mini',
    fields: [

      { name: 'tema',     label: 'Tema',     type: 'text', placeholder: 'Ej: Ecosistemas', required: true },
      { name: 'grado',    label: 'Grado',    type: 'select', options: GRADOS, default: '5to' },
      { name: 'cantidad', label: 'Cantidad', type: 'number', default: 10 },
          { name: 'estandares', type: 'standards', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER + IMAGE_INSTRUCTIONS,
    buildPrompt: (f) => `Genera ${f.cantidad || 10} palabras de vocabulario académico sobre "${f.tema}" para ${f.grado} grado.

Formato: tabla markdown con columnas: **Palabra | Categoría gramatical | Definición simple | Oración de ejemplo | Sinónimo**.

Después de la tabla, para las 3-5 palabras MÁS importantes/abstractas, incluye un tag [IMAGE: prompt en inglés] de una tarjeta visual ilustrando ese concepto (estilo: "vocabulary flashcard illustration, single concept clear, age-appropriate, white background, labeled in Spanish").

Termina con **3 actividades** breves para reforzar el vocabulario (ej. completar oraciones, emparejar, crear su propia oración).`,
  },

  'Preguntas de Comprensión': {
    category: 'lectura',
    title: 'Preguntas de Comprensión',
    subtitle: 'Literal, inferencial y crítica a partir de un texto.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'texto',  label: 'Pega el texto', type: 'textarea', placeholder: 'Pega el texto de la lectura aquí…', required: true, rows: 8 },
      { name: 'grado',  label: 'Grado', type: 'select', options: GRADOS, default: '5to' },
      { name: 'literales',     label: 'Cantidad literales',     type: 'number', default: 4 },
      { name: 'inferenciales', label: 'Cantidad inferenciales', type: 'number', default: 3 },
      { name: 'criticas',      label: 'Cantidad críticas',      type: 'number', default: 2 },
          { name: 'estandares', type: 'standards', subject: 'Español', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER,
    buildPrompt: (f) => `A partir del siguiente texto, genera preguntas de comprensión para ${f.grado} grado.

Texto:
"""
${f.texto}
"""

Genera:
- ${f.literales || 4} **preguntas literales** (la respuesta está explícita)
- ${f.inferenciales || 3} **preguntas inferenciales** (requieren deducir, conectar ideas)
- ${f.criticas || 2} **preguntas críticas / reflexivas** (opinión fundamentada, conexión con la vida real)

Después de cada bloque añade una **clave breve de respuestas** indicando el segmento del texto donde se evidencia (literales/inferenciales) o el tipo de razonamiento esperado (críticas).`,
  },

  'Evaluación Lexile': {
    category: 'lectura',
    title: 'Evaluación Lexile',
    subtitle: 'Prueba diagnóstica por nivel lector con feedback.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [

      { name: 'rango', label: 'Rango Lexile aproximado', type: 'select', options: ['BR-200L (inicial)', '200L-500L', '500L-800L', '800L-1000L', '1000L-1200L', '1200L+'], default: '500L-800L', required: true },
      { name: 'tema',  label: 'Tema para el texto', type: 'text', placeholder: 'Ej: El Yunque', required: true },
      { name: 'grado', label: 'Grado del estudiante', type: 'select', options: GRADOS, default: '5to' },
          { name: 'estandares', type: 'standards', subject: 'Español', gradeField: 'grado' },
],
    system: SYSTEM_TEACHER,
    buildPrompt: (f) => `Crea una **evaluación de comprensión lectora** calibrada al rango Lexile **${f.rango}** para ${f.grado} grado, sobre "${f.tema}".

Incluye:
1. **Texto de lectura** ajustado al rango (longitud y complejidad apropiadas)
2. **10 preguntas** de selección múltiple (4 opciones cada una)
   - 4 literales · 4 inferenciales · 2 de vocabulario en contexto
3. **Tabla de análisis** para interpretar resultados:
   - 9-10 correctas → nivel arriba del rango
   - 7-8 → en nivel
   - 5-6 → necesita refuerzo
   - <5 → bajar nivel y reevaluar
4. **Recomendaciones de instrucción** según resultado
5. **Clave de respuestas**`,
  },

  /* ─── Asistentes (chat) — usan el modal en modo conversacional ─── */
  'Asistente de Matemáticas': {
    category: 'asistentes',
    isChat: true,
    title: 'Asistente de Matemáticas',
    subtitle: 'Pregúntale lo que necesites — álgebra, geometría, aritmética.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [{ name: 'pregunta', label: 'Tu pregunta', type: 'textarea', placeholder: 'Ej: ¿Cómo explico la multiplicación de fracciones con un modelo visual a 5to grado?', required: true, rows: 5 }],
    system: SYSTEM_TEACHER + ' Eres especialista en matemáticas K-12. Explicas con modelos visuales cuando ayude. Usa LaTeX entre $...$ para fórmulas.',
    buildPrompt: (f) => f.pregunta,
  },

  'Asistente de Ciencias': {
    category: 'asistentes',
    isChat: true,
    title: 'Asistente de Ciencias',
    subtitle: 'Biología, química, física y experimentos.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [{ name: 'pregunta', label: 'Tu pregunta', type: 'textarea', placeholder: 'Ej: ¿Qué experimento simple puedo hacer con materiales caseros para explicar la fotosíntesis?', required: true, rows: 5 }],
    system: SYSTEM_TEACHER + ' Eres especialista en ciencias K-12, NGSS-aligned. Sugiere experimentos seguros y materiales accesibles.',
    buildPrompt: (f) => f.pregunta,
  },

  'Asistente de Idiomas': {
    category: 'asistentes',
    isChat: true,
    title: 'Asistente de Idiomas',
    subtitle: 'Inglés, español, traducción contextual.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [{ name: 'pregunta', label: 'Tu pregunta', type: 'textarea', placeholder: 'Ej: Traduce esta instrucción al inglés con vocabulario apropiado para 3er grado…', required: true, rows: 5 }],
    system: SYSTEM_TEACHER + ' Eres especialista en español e inglés, contexto bilingüe Puerto Rico. Cuando traduzcas, preserva el registro y nivel apropiado.',
    buildPrompt: (f) => f.pregunta,
  },

  'Asistente de ELA (Inglés)': {
    category: 'asistentes',
    isChat: true,
    title: 'Asistente de ELA (Inglés)',
    subtitle: 'Grammar, writing, reading comprehension.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [{ name: 'pregunta', label: 'Your question / Tu pregunta', type: 'textarea', placeholder: 'Ej: How can I scaffold a 5-paragraph essay for ELL students at intermediate level?', required: true, rows: 5 }],
    system: SYSTEM_TEACHER + ' You are an ELA specialist K-12. You can respond in English or Spanish depending on the question. Focus on writing process, grammar in context, and reading comprehension strategies aligned to CCSS-ELA.',
    buildPrompt: (f) => f.pregunta,
  },

  'Estudios Sociales': {
    category: 'asistentes',
    isChat: true,
    title: 'Asistente de Estudios Sociales',
    subtitle: 'Historia, geografía, cultura, énfasis Puerto Rico y el Caribe.',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [{ name: 'pregunta', label: 'Tu pregunta', type: 'textarea', placeholder: 'Ej: Necesito una línea de tiempo de la migración taína al Caribe para 4to grado…', required: true, rows: 5 }],
    system: SYSTEM_TEACHER + ' Eres especialista en estudios sociales con énfasis en Puerto Rico, el Caribe y América Latina. Cita fuentes históricas cuando sea relevante.',
    buildPrompt: (f) => f.pregunta,
  },

  'Coach de Ed. Especial': {
    category: 'asistentes',
    isChat: true,
    title: 'Coach de Educación Especial',
    subtitle: 'Estrategias para estudiantes con SPED (IDEA-aligned).',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [{ name: 'pregunta', label: 'Tu pregunta', type: 'textarea', placeholder: 'Ej: ¿Qué acomodaciones recomiendas para un estudiante con dislexia en lecturas largas?', required: true, rows: 5 }],
    system: SYSTEM_TEACHER + ' Eres coach especialista en educación especial (IDEA / Sec. 504). Respondes con estrategias prácticas, basadas en evidencia, respetuosas del estudiante, alineadas al PEI (Programa Educativo Individualizado) de PR. Sugiere siempre adaptaciones específicas y accionables (no genéricas).',
    buildPrompt: (f) => f.pregunta,
  },

  'Coach para ELL': {
    category: 'asistentes',
    isChat: true,
    title: 'Coach para ELL',
    subtitle: 'Apoyo a aprendices de inglés (estrategias SIOP/WIDA).',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    fields: [{ name: 'pregunta', label: 'Tu pregunta', type: 'textarea', placeholder: 'Ej: Estrategias SIOP para una clase de ciencias en 5to grado con 6 estudiantes ELL nivel emergente…', required: true, rows: 5 }],
    system: SYSTEM_TEACHER + ' Eres coach especialista en estudiantes ELL (English Language Learners), familiarizado con WIDA Can-Do Descriptors y el modelo SIOP. Tus respuestas incluyen siempre sentence frames y scaffolds específicos al nivel WIDA mencionado.',
    buildPrompt: (f) => f.pregunta,
  },
};

export { TOOLS, MODELS };
