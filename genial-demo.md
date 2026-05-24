# Genial Skills Demo — Gestión de archivos extraídos de la plataforma

Eres un experto en el proyecto de rediseño demo de maestros.genialskillsweb.com.
Tienes acceso completo a todos los archivos extraídos de la plataforma real.

## Contexto del proyecto

Este es un demo rediseñado de la plataforma educativa Genial Skills Web para maestros.
Los archivos fueron extraídos directamente de la app real vía ingeniería inversa del browser.

### APIs reales verificadas
- `https://athenasapi.genialskillsweb.com` → Header: `Authorization: Bearer <token>`
- `https://baseapi.genialskillsweb.com`    → Header: `token: <token>`
- Token fuente: `localStorage.getItem('auth').Token`

### Archivos disponibles en el proyecto
```
src/
├── navigation/
│   ├── AppLayout.jsx          ← Header (#27466C) + Nav lateral + Layout wrapper
│   └── icons/                 ← 12 SVGs reales del menú (home, students, groups,
│       └── *.svg                 planning, progress, pending, invitations,
│                                 chat, messages, teams, catalog, logo)
├── catalog/
│   └── LessonCatalog.jsx      ← Catálogo completo con API real (POST /lessons/advance)
├── planning/
│   ├── index.jsx              ← Router interno: lista → crear → detalle
│   ├── PlanningCreate.jsx     ← Formulario /v2/plannings-create
│   └── PlanningDetail.jsx     ← Vista /v2/plannings-detail con cotejo completo
└── data/
    └── mockData.js            ← 68 materias + grades + planning real (mock data)
```

## Tu tarea: $ARGUMENTS

Cuando el argumento esté vacío o sea "status", muestra el estado del proyecto:
- Lista todos los archivos del demo con su descripción
- Identifica qué falta por implementar
- Sugiere los próximos pasos

Cuando el argumento sea una acción específica, ejecútala:

### Acciones disponibles

**`integrate`** — Integra todos los componentes en una app React funcional.
Crea `src/App.jsx` con routing entre: Dashboard → Planificación → Catálogo.
Usa `AppLayout` como wrapper para todas las páginas.

**`wire-api`** — Conecta los componentes con la API real.
Verifica que los headers sean correctos (`token` para baseapi, `Bearer` para athenas).
Prueba cada endpoint con fetch y reporta cuáles responden 200.

**`add-ai-tool <nombre>`** — Añade una herramienta de IA al demo.
Nombres válidos: `plan-lesson`, `rubric-generator`, `dok-questions`,
`ell-scaffold`, `differentiation`, `lesson-adaptation`, `student-feedback`.
Crea el componente en `src/ai-tools/<nombre>.jsx` usando la Anthropic API
(`https://api.anthropic.com/v1/messages`, model: `claude-sonnet-4-20250514`).

**`fix <archivo>`** — Revisa y corrige errores en un componente específico.
Verifica imports, props, estilos y conexión con la API real.

**`add-page <nombre>`** — Añade una nueva página al demo replicando la estructura
de la app real. Nombres sugeridos: `progress`, `students`, `groups`, `pending`,
`messages`, `invitations`.

**`sync-icons`** — Verifica que todos los iconos SVG del nav estén presentes
y que coincidan con los 11 items del menú real de la app.

**`build-demo`** — Ensambla el demo completo listo para presentar:
1. Integra todos los componentes existentes
2. Añade datos mock realistas
3. Crea una pantalla de login simple con el logo y los colores de la app
4. Asegura que la navegación funcione entre todas las páginas
5. Verifica que el build de producción no tenga errores

**`check-api`** — Verifica el estado de las APIs en tiempo real.
Ejecuta fetch a cada endpoint conocido y reporta:
- Status code
- Tiempo de respuesta
- Si requiere token o no
- Estructura del response

### Reglas de implementación

1. **Paleta de colores exacta** — Usar siempre:
   - Azul primario: `#27466C`
   - Teal acento: `#6AD8D2`
   - Ámbar: `#E88B19`
   - Fondo: `#F4F6F9`
   - Texto: `#424242`

2. **Headers de API correctos** — NUNCA mezclar los headers:
   ```js
   // Para baseapi:
   { 'token': jwt }
   // Para athenasapi:
   { 'Authorization': 'Bearer ' + jwt }
   ```

3. **Fallback siempre** — Todo componente que llame a una API real
   debe tener un `try/catch` con mock data de respaldo.

4. **Estructura de archivos** — Respetar la estructura existente.
   No mover archivos sin actualizar todos los imports.

5. **Sin dependencias nuevas** — Solo usar React + fetch nativo.
   No instalar axios, react-router, ni librerías de UI externas
   a menos que el usuario lo pida explícitamente.
