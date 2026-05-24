# Athenas Lessons Cache

Drop JSON files into this folder to populate the **Lesson Picker** in AI tools
(used by tools that accept "una lección existente" as input).

## What I need from you

A response (or multiple responses) from the live Athenas API:

```
POST https://athenasapi.genialskillsweb.com/api/lessons/advance
Header:  Authorization: Bearer <token>
Body:    { "subjectCode": "mat-sp", "levelCode": "5", "page": 1, "pageSize": 50 }
```

The endpoint returns lessons in any of these shapes (we auto-detect):

```jsonc
// shape A — flat array
[
  { "Id": "205105", "LessonTitle": "Identifica el inicio y el cierre…", "SubjectCode": "sp", "LevelCode": "k", "std": "K.LLI.5", "Objective": "..." },
  ...
]

// shape B — wrapped
{ "lessons": [ ...same shape... ] }
{ "Data":    [ ...same shape... ] }
```

## Suggested filenames

`lessons-{subjectCode}-{grade}.json`
For example:
- `lessons-mat-sp-5.json`     (Matemáticas, 5to)
- `lessons-sci-sp-4.json`     (Ciencias, 4to)
- `lessons-mat-en-3.json`     (Math English, 3rd)

After dropping the files, restart the backend (Ctrl+C → `node server.js`)
or invalidate the cache. The picker auto-detects subject+grade coverage.
