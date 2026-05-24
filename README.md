# Genial Skills Maestro

Plataforma de planificación instruccional con IA para maestros del Departamento de Educación de Puerto Rico. Réplica de [maestros.genialskillsweb.com](https://maestros.genialskillsweb.com) con un copiloto IA conectado a Claude/GPT/Gemini vía OpenRouter, estándares DEPR completos (6,800+ expectativas oficiales) y catálogo de lecciones Athenas.

## Stack

- **Frontend**: React 18 + Vite + Poppins/Sora
- **Backend**: Node 20 + Express (proxy a OpenRouter, parser de PDFs, agregador de estándares)
- **IA**: OpenRouter (Claude Sonnet 4.5 / Haiku 4.5 / GPT-4o / Gemini 2.5)
- **Exportación**: KaTeX (matemáticas), jsPDF, html2canvas, pptxgenjs
- **Deploy**: Render (free tier) + Cloudflare R2 (PDFs)

## Estructura

```
src/
├── App.jsx                       # router interno
├── main.jsx                      # entry
├── components/
│   ├── AppLayout.jsx             # header navy + sidebar teal (replica del DOM real)
│   ├── ToolModal.jsx             # modal IA universal (form + streaming + export)
│   ├── StandardsPicker.jsx       # picker de estándares DEPR
│   ├── AthenasLessonPicker.jsx   # picker de lecciones del catálogo Athenas
│   ├── exporters.js              # PDF, PPTX, Worksheet
│   └── Welcome.jsx, QuickGrid.jsx, AITools.jsx, RightColumn.jsx, Icons.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── AIToolsPage.jsx           # 24 herramientas IA en grid
│   ├── planning/index.jsx        # módulo de planificación completo (Cotejo)
│   ├── LessonCatalog.jsx
│   └── Placeholder.jsx
└── data/
    ├── toolsConfig.js            # 24 herramientas con prompts + estándares
    └── mockData.js

server.js                         # Express API (proxy OpenRouter + estándares + plans)
standards-loader.js               # carga JSONs de estándares con cache
standards/                        # 57 JSONs (6,817 estándares DEPR parseados)
athenas-cache/                    # 39 JSONs (94 lecciones del catálogo Athenas)
scripts/
├── extract-pdfs.mjs              # PDFs DEPR → texto crudo
├── parse-standards.mjs           # texto crudo → JSONs estructurados
├── index-plans.mjs               # catalog de los ~1,200 planes semanales
├── extract-fewshot.mjs           # 22 ejemplos few-shot para Plan My Lesson
├── seed-athenas.mjs              # convierte lessonsCatalog.js → athenas-cache/
└── reorder-standards.mjs         # mueve el campo estandares al final
```

## Setup local

```bash
git clone git@github.com:yobu740/genial-skills-maestro.git
cd genial-skills-maestro
npm install
cp .env.example .env             # edita .env con tu OpenRouter key
npm run dev:all                  # corre backend (8001) + frontend (5173) juntos
```

Abre [http://localhost:5173](http://localhost:5173). Vite proxyea `/api/*` al backend.

### Variables de entorno

| Variable | Requerido | Descripción |
|---|---|---|
| `OPENROUTER_API_KEY` | **Sí** | Key de [openrouter.ai](https://openrouter.ai/keys). Modelos: Claude, GPT, Gemini |
| `PORT` | No (default 8001) | Puerto del backend Express |
| `WEEKLY_PLANS_BASE_URL` | No | URL pública del bucket R2 con los planes semanales (ver más abajo). Sin esto, los PDFs se sirven de disco local en dev |

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Solo Vite dev server (5173) |
| `npm run api` | Solo Express backend (8001) |
| `npm run dev:all` | Ambos en paralelo |
| `npm run build` | Compila Vite → `dist/` |
| `npm start` | Producción: Express sirve `dist/` + APIs (puerto 8001) |

## Deploy a Render

### 1. GitHub

```bash
gh repo create genial-skills-maestro --private --source=. --remote=origin
git push -u origin main
```

(O crea el repo manualmente en github.com y `git remote add origin git@github.com:yobu740/genial-skills-maestro.git`)

### 2. Render

1. Ve a [render.com](https://dashboard.render.com/) → **New +** → **Blueprint**
2. Conecta el repo `genial-skills-maestro`
3. Render detecta `render.yaml` automáticamente
4. En la sección Environment, configura los secrets:
   - `OPENROUTER_API_KEY` = tu key real
   - `WEEKLY_PLANS_BASE_URL` = (déjalo vacío por ahora, lo seteas después)
5. **Deploy** — primer build toma ~3-5 min
6. Tu URL será: `https://genial-skills-maestro.onrender.com`

> **Free tier**: el servicio duerme tras 15 min de inactividad. Primer request después → cold start ~30s. Para eliminar esto, sube a "Starter" ($7/mes).

### 3. Cloudflare R2 (PDFs de planes semanales)

Los ~1,200 PDFs/PPTX (6 GB) NO van en el repo. Sube a R2:

1. **Crea un bucket** en Cloudflare → R2 → Create Bucket → nombre: `genial-plans`
2. **Sube los archivos** (mirror la estructura local):
   ```
   genial-plans/
   ├── planes-semanales/
   │   ├── EDUCACION FISICA-Planes Semanales/...
   │   ├── ENGLISH-Weekly Plans/...
   │   └── ESTUDIOS SOCIALES-Planes Semanales/...
   ├── bellas-artes/
   │   └── BELLAS ARTES-Planes semanales/...
   └── estudios-sociales/
       └── ...
   ```
   Usa el dashboard de Cloudflare (drag-and-drop) o `rclone` para upload masivo:
   ```bash
   rclone copy "Planes semanales" r2:genial-plans/planes-semanales --progress
   rclone copy "BELLAS ARTES-Planes semanales-20260521T025922Z-3-001" r2:genial-plans/bellas-artes --progress
   rclone copy "Estudios sociales-Planes semanales" r2:genial-plans/estudios-sociales --progress
   ```
3. **Habilita acceso público**: bucket settings → Public Access → r2.dev domain
4. **Setea la URL en Render**:
   - `WEEKLY_PLANS_BASE_URL` = `https://pub-xxxxxxxxxxxx.r2.dev` (la URL pública del bucket)
5. Re-deploy

Ahora la sección **Planificación → Templates** carga los archivos desde R2 directamente.

## APIs disponibles

| Endpoint | Función |
|---|---|
| `POST /api/generate` | Streaming chat (SSE). Body: `{model, system, user}` |
| `POST /api/compare` | Corre el mismo prompt en N modelos en paralelo |
| `POST /api/generate-full-plan` | Genera planificación semanal completa (cotejo + lecciones) |
| `POST /api/extract-text` | Sube PDF/DOCX/TXT → devuelve texto extraído |
| `GET  /api/standards` | Estándares DEPR por materia + grado |
| `GET  /api/weekly-plans` | Catálogo indexado de planes (con facets) |
| `GET  /api/fewshot-plans` | Ejemplos few-shot por materia + grado |
| `GET  /api/athenas-lessons` | Lecciones del catálogo Athenas |
| `GET  /api/health` | Health check |

## Seguridad

- **`.env` está en `.gitignore`** — nunca commitees secrets.
- **`OPENROUTER_API_KEY`** se configura solo en Render dashboard (secret manager).
- **Validación de uploads**: límite 10 MB, solo PDF/DOCX/TXT.
- **Rate limiting**: aún no implementado. Recomendado para producción.

## Roadmap

- [ ] Auth real (Auth0 o Clerk)
- [ ] Persistencia de planes (Postgres o Cloudflare D1)
- [ ] Wire-up de los APIs reales de Athenas + baseapi (no solo cache)
- [ ] Rate limiting en `/api/generate`
- [ ] OCR para imágenes subidas como fuente
- [ ] Más lecciones en `athenas-cache/` (cuando estén disponibles)

---

Hecho con 🧠 + ☕ para maestros de Puerto Rico.
