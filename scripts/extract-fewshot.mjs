/**
 * Pick one PLAN.pdf per (subject, scope) and extract its text.
 * Output: standards/fewshot-plans.json — array of { subject, scope, unit, week, text }.
 *
 * Used by Plan My Lesson to give the model concrete examples of how DEPR plans
 * are actually written in this district.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const index = JSON.parse(await fs.readFile(path.join(ROOT, 'weekly-plans-index.json'), 'utf8'));

// Filter: only PDF plans (most reliable to parse)
const plans = index.filter(p => p.kind === 'plan' && p.ext === 'pdf');

// Pick one earliest plan per (subject, scope)
const picks = new Map();
for (const p of plans) {
  const key = `${p.subject}|${p.scope}`;
  const existing = picks.get(key);
  if (!existing || (p.unit < existing.unit) || (p.unit === existing.unit && (p.week || 0) < (existing.week || 0))) {
    picks.set(key, p);
  }
}

console.log(`Selected ${picks.size} representative plans for few-shot extraction:`);

const out = [];
for (const [key, plan] of picks) {
  console.log(`  ${key.padEnd(40)} ${plan.filename}`);
  try {
    const buf  = await fs.readFile(path.join(ROOT, plan.path));
    const data = await pdf(buf);
    // Trim aggressively — only need ~2000 chars per example
    let text = data.text
      .replace(/\r/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    if (text.length > 3500) text = text.slice(0, 3500) + '\n…[truncated]';
    out.push({
      subject:  plan.subject,
      scope:    plan.scope,
      unit:     plan.unit,
      week:     plan.week,
      filename: plan.filename,
      text,
    });
  } catch (e) {
    console.log(`    failed: ${e.message}`);
  }
}

await fs.writeFile(
  path.join(ROOT, 'standards', 'fewshot-plans.json'),
  JSON.stringify(out, null, 2),
  'utf8',
);
console.log(`\nWrote standards/fewshot-plans.json — ${out.length} examples, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
