# Catálogo de estándares — DEPR / CCSS / NGSS

Este directorio contiene los estándares y expectativas de Puerto Rico en formato
JSON estructurado. Cada herramienta de IA filtra por `subject + grade` y opcionalmente
por códigos específicos seleccionados por el maestro.

## Estructura de archivos

```
standards/
  schema.json                 # JSON Schema de un estándar individual
  pr-{subject}-{grade}.json   # un archivo por materia + grado
```

`subject` codes: `mat` (Matemáticas), `cie` (Ciencias), `esp` (Español),
`ing` (Inglés/ELA), `est` (Estudios Sociales).

`grade` codes: `k`, `1`-`12`.

Ejemplo: `pr-mat-5.json` = Matemáticas 5to grado.

## Migración futura a Athenas

Toda la carga pasa por `standards-loader.js` (raíz del proyecto). El día que el
API de Athenas esté listo, sólo cambia `loadAll()` para llamar al API en lugar
de leer del disco — la forma del JSON es la misma.

## Cómo añadir estándares nuevos

1. Pásame el PDF oficial del DEPR (o sub-set por materia/grado)
2. Lo parseo y genero el archivo `pr-{subject}-{grade}.json` validado contra `schema.json`
3. Reinicio del servidor y queda disponible vía `GET /api/standards?subject=...&grade=...`
