---
name: athenas-audio-2
description: "Automatically generate and upload ElevenLabs TTS audio (English, voice Carmiribi) to lessons and quiz evaluations on the Athenas platform (athenas-dev.genialskillsweb.com). Use whenever asked to 'add audio', 'process audio', 'generate audios for lesson [ID]', 'fix Spanish audios', 'renew audios', or similar. Handles Concepto, Definiciones, Ejemplos, and all quiz evaluations (Practice 1/2/2b, Pretest, Test 1/2/2b, Posttest). Always use this skill for any Athenas audio task."
---

# Athenas Audio Skill v2

Generates ElevenLabs TTS audio and uploads to Athenas lesson sections and quiz evaluations. English voice: **Carmiribi Cuenta 2**.

---

## Constants (inject at top of every script)

```javascript
const EL_KEY = "sk_b7e9cb70ddda401578d5105eb48e869c1705aa664842587e";
const VOICE_ID = "QV50XrfYwH5G3nRLspaq"; // Carmiribi cuenta 2
const MODEL = "eleven_v3";
const UPLOAD_URL = 'https://athenasapi-dev.genialskillsweb.com/api/files/upload?subject=sp&level=k&uploadType=audio&langCode=undefined';
const TOKEN = JSON.parse(localStorage.getItem('auth') || '{}').Token;
```

---

## Core Helper Functions

```javascript
function getCleanText(ed) {
  const cleanHtml = ed.getContent().replace(/<audio[^>]*>[\s\S]*?<\/audio>/gi, '');
  ed.setContent(cleanHtml);
  return ed.getContent({ format: 'text' }).trim().replace(/_+/g, 'blank').trim();
}

async function genAudio(text) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: { "xi-api-key": EL_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.80, style: 0.3, use_speaker_boost: true } })
  });
  if (!r.ok) throw new Error('EL error: ' + r.status);
  return r.blob();
}

async function upload(blob, filename) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', new File([blob], filename, { type: 'audio/mpeg' }));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Token', TOKEN);
    xhr.setRequestHeader('Accept-Language', 'es');
    xhr.onload = () => {
      try { const d = JSON.parse(xhr.responseText); resolve(d.Messages?.[0] || xhr.responseText.replace(/"/g, '')); }
      catch(e) { resolve(xhr.responseText.replace(/"/g, '')); }
    };
    xhr.onerror = () => reject(new Error('upload failed'));
    xhr.send(fd);
  });
}

function insertAudio(ed, url) {
  const clean = ed.getContent().replace(/<audio[^>]*>[\s\S]*?<\/audio>/gi, '');
  ed.setContent(clean + `<p><audio preload="none" controls="controls"><source src="${url}" type="audio/mp3" />Your browser does not support the audio element.</audio></p>`);
}
```

---

## CRITICAL RULES — READ ALL BEFORE STARTING

### RULE 1 — Always use getCleanText() before reading editor text
NEVER use `ed.getContent({format:'text'})` directly — it returns "Your browser does not support the audio element." from previous audio. Always use `getCleanText(ed)` which strips audio tags first.

### RULE 2 — Quiz instructions: ONE Guardar Quiz, correct sequence
**THE BUG**: Saving from Tab Preguntas always clears the Contenido Extra (unchecks checkbox, deletes audio). There is NO way around this — two separate saves don't work.

**CORRECT SEQUENCE for each quiz:**
1. Read instruction text from `textarea.form-control` (NEVER from TinyMCE)
2. Generate instrUrl (upload but DON'T insert yet)
3. Click Tab Preguntas → process all questions
4. Click Tab Info → activate checkbox if unchecked → wait for TinyMCE → insert instrUrl
5. ONE single Guardar Quiz
6. Screenshot to verify: checkbox ✅ AND counter > 0 (not 0/999999)

```javascript
// CORRECT QUIZ FULL SCRIPT TEMPLATE:
(async () => {
  // STEP 1: Generate instr URL while still on Tab Info
  const instr = document.querySelector('textarea.form-control')?.value?.trim();
  const instrUrl = await upload(await genAudio(instr), 'instrucciones.mp3');

  // STEP 2: Process questions (Tab Preguntas)
  Array.from(document.querySelectorAll('a,button')).find(el => el.innerText?.trim() === 'Preguntas' && el.offsetParent !== null)?.click();
  await new Promise(r => setTimeout(r, 2000));
  // ... process questions ...

  // STEP 3: Go back to Info, activate checkbox, insert, then ONE save
  Array.from(document.querySelectorAll('a,button')).find(el => el.innerText?.trim() === 'Info' && el.offsetParent !== null)?.click();
  await new Promise(r => setTimeout(r, 2000));
  const cb = document.querySelector('input[type="checkbox"]');
  if (cb && !cb.checked) { cb.click(); await new Promise(r => setTimeout(r, 2000)); }
  let instrEd = null;
  for (let i = 0; i < 10; i++) {
    const eds = tinymce.editors.filter(e => !e.id.includes('_ifr'));
    if (eds.length) { instrEd = eds[0]; break; }
    await new Promise(r => setTimeout(r, 500));
  }
  instrEd.setContent(`<p><audio preload="none" controls="controls"><source src="${instrUrl}" type="audio/mp3" />Your browser does not support the audio element.</audio></p>`);
  await new Promise(r => setTimeout(r, 500));
  window.alert = function(msg) { return undefined; };
  const g = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim().includes('Guardar Quiz') && b.offsetParent !== null);
  if (g) { g.scrollIntoView({ block: 'center' }); g.click(); }
  await new Promise(r => setTimeout(r, 3500));
  window.alert = function(msg) { return undefined; };
})();
```

### RULE 3 — Screenshot after every Guardar Quiz
After SPA resets, ALWAYS take a screenshot and verify:
- ✅ Checkbox "Contenido Extra" is checked
- ✅ Counter shows > 0 / 999999 (e.g. 426 / 999999)
- If counter = 0 / 999999 → audio NOT saved → repeat

### RULE 4 — Sidebar navigation: use JS, NOT coordinates
```javascript
Array.from(document.querySelectorAll('a'))
  .find(el => el.innerText?.trim() === 'Definiciones' && el.offsetParent !== null)?.click();
```

### RULE 5 — Map editors by Y-position (Definiciones/Ejemplos)
NEVER use fixed indexes. Always sort by getBoundingClientRect().top and match keywords to editors positionally.
```javascript
const keywords = Array.from(document.querySelectorAll('input[type="text"]'))
  .filter(i => i.offsetParent !== null && i.value.trim() && !i.placeholder)
  .map(k => ({ val: k.value, y: k.getBoundingClientRect().top }))
  .sort((a,b) => a.y - b.y);

const eds = tinymce.editors
  .filter(ed => !ed.id.includes('_ifr'))
  .map(ed => ({ ed, y: ed.getContainer()?.getBoundingClientRect()?.top || 0 }))
  .filter(e => e.y > 0)
  .sort((a,b) => a.y - b.y)
  .map(e => e.ed);
```

### RULE 6 — Scroll to load all editors before counting
Always scroll to bottom then back to top before mapping editors. Editors with y=0 are not yet loaded.
```javascript
window.scrollTo(0, document.body.scrollHeight);
await new Promise(r => setTimeout(r, 2000));
window.scrollTo(0, 0);
await new Promise(r => setTimeout(r, 1000));
```

### RULE 7 — window.alert override
Always set at start and after each Guardar Quiz:
```javascript
window.alert = function(msg) { return undefined; };
window.confirm = function(msg) { return true; };
```

### RULE 8 — No top-level await
NEVER use `await` outside async functions in javascript_exec. Always wrap in `(async () => { ... })()`.

### RULE 9 — SPA reset = successful save
When `window._log` / `window._done` returns `{}` (empty), the SPA reset = quiz was saved successfully.

### RULE 10 — Quizzes to skip
NEVER process: Practice 4, Test 4, Prueba 4 — they contain images.
Process: Practice 1, Practice 2, Practice 2b, Pretest, Test 1, Test 2, Test 2b, Posttest.

### RULE 11 — Old Spanish audios: "bodyPart_" prefix
Old audios in Spanish have `bodyPart_` in their URL. New audios uploaded also get `bodyPart_` names from the server — this is NORMAL. Verify by checking if the audio was generated in the current session, not by filename.

### RULE 12 — Instructions: read from textarea, NEVER TinyMCE
```javascript
const instr = document.querySelector('textarea.form-control')?.value?.trim();
```
TinyMCE editor for instructions will return empty or fallback text.

### RULE 13 — YES/NO image-based answers
Some quizzes have YES/NO as image buttons in Respuestas. To replace their audio:
```javascript
const YES_IMG_ID = 'bodyPart_f19cd787'; // YES image identifier
const NO_IMG_ID  = 'bodyPart_84b313aa'; // NO image identifier

// Replace audio keeping the image:
function replaceAudio(ed, url) {
  let html = ed.getContent().replace(/<audio[^>]*>[\s\S]*?<\/audio>/gi, '');
  html += `<p><audio preload="none" controls="controls"><source src="${url}" type="audio/mp3" />Your browser does not support the audio element.</audio></p>`;
  ed.setContent(html);
}

// Detect and replace in each editor:
const html = ed.getContent();
if (html.includes(YES_IMG_ID)) { replaceAudio(ed, yesUrl); }
else if (html.includes(NO_IMG_ID)) { replaceAudio(ed, noUrl); }
```

---

## Workflow

### 1 — Verify lesson is open
Screenshot to confirm lesson ID and current section.

### 2 — Concepto (Tab Info)
- Find editor with `y > 0` AND contains `<img>`
- Use `getCleanText(ed)` to read text
- Generate audio → insert → ask user to click **Guardar** → confirm

### 3 — Definiciones
- Navigate via JS click
- Scroll bottom→top to load all editors
- Map keywords ↔ editors by Y-position
- Audio text: `"keyword. definition text"`
- Insert all → ask user **Guardar** → confirm

### 4 — Ejemplos
- Same as Definiciones
- Audio text: `"keyword. example text"`
- Insert all → ask user **Guardar** → confirm

### 5 — Evaluaciones (for each quiz)
Use the CORRECT SEQUENCE from Rule 2:
1. Open quiz → confirm name with regex `/(Practice \d+\w*|Pretest|Test \d+\w*|Posttest)/`
2. Generate instrUrl (Tab Info, textarea)
3. Tab Preguntas → detect maxQ → process all questions with getCleanText
4. Tab Info → checkbox → insert instrUrl → ONE Guardar Quiz
5. Screenshot to verify checkbox ✅ and counter > 0

### Detect maxQ
```javascript
const nums = Array.from(document.querySelectorAll('*'))
  .filter(el => el.children.length === 0 && /^\d+$/.test(el.innerText?.trim()) && el.offsetParent !== null)
  .map(el => parseInt(el.innerText.trim())).filter(n => n > 0 && n <= 25);
const maxQ = nums.length ? Math.max(...nums) : 0;
```

### Process questions loop
```javascript
for (let q = 1; q <= maxQ; q++) {
  Array.from(document.querySelectorAll('*'))
    .filter(el => el.children.length === 0 && el.innerText?.trim() === String(q) && el.offsetParent !== null)[0]?.click();
  await new Promise(r => setTimeout(r, 1500));
  window.alert = function(msg) { return undefined; };
  const eds = tinymce.editors.filter(ed => !ed.id.includes('_ifr'));
  for (let i = 0; i < eds.length; i++) {
    const text = getCleanText(eds[i]);
    if (!text) continue;
    const url = await upload(await genAudio(text), `q${q}_${i}.mp3`);
    insertAudio(eds[i], url);
  }
  await new Promise(r => setTimeout(r, 400));
}
```

### Monitor progress
```javascript
JSON.stringify({ done: window._done, log: window._log?.slice(-5) });
```

---

## Navigating Between Lessons/Quizzes

```javascript
// Back to lesson
Array.from(document.querySelectorAll('a'))
  .find(el => el.innerText?.trim() === 'Volver a Lección' && el.offsetParent !== null)?.click();

// Open evaluaciones
Array.from(document.querySelectorAll('a'))
  .find(el => el.innerText?.trim() === 'Evaluaciones' && el.offsetParent !== null)?.click();

// Open quiz by index (0=P1, 1=P2, 2=P2b, 3=Pretest, 4=T1, 5=T2, 6=T2b, 7=Posttest)
const links = Array.from(document.querySelectorAll('a')).filter(a => a.innerText?.trim() === 'Ver/Editar' && a.offsetParent !== null);
links[INDEX]?.click();
```

---

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Counter shows 0/999999 after save | Second Guardar Quiz cleared Contenido Extra | Re-insert instrucciones ONLY (no questions), single Guardar Quiz |
| "await is not valid" | top-level await in javascript_exec | Wrap everything in `(async () => { ... })()` |
| Editor text = "Your browser does not support..." | Reading audio fallback text | Always use `getCleanText(ed)` |
| Editors all have y=0 | Not yet rendered | Scroll bottom→top first |
| SPA returns `{}` on log check | SPA reset after save | This is SUCCESS — check screenshot |
| Audio URL still `bodyPart_xxx` | Normal — server naming | Not an error; verify audio content instead |
| Page frozen/renderer unresponsive | Too many operations | Ask user to refresh (F5), then continue |
