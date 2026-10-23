// @ts-check
/**
 * Generates FICTIONAL CV files for import tests: a small text PDF (written by
 * hand, byte offsets computed) and a DOCX made by our own DOCX writer.
 * Output: tests/fixtures/cv/  Run: node scripts/dev/generate-cv-fixtures.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/content.mjs';
import { buildCvDocx } from '../../src/core/exports/docx.js';
import { newWorkspace } from '../../src/core/schema.js';

const OUT = join(ROOT, 'tests', 'fixtures', 'cv');
mkdirSync(OUT, { recursive: true });

const LINES = ['Yara Example (fictional)', 'Logistics coordinator', 'Experience', '2019-2024 Planner, Example Transport BV (fictional)', 'Planned routes for 15 drivers in Excel.', 'Languages: Arabic native, English B2, Dutch A2'];

/** A one-page PDF with plain Helvetica text. */
function pdf() {
  const text = LINES.map((l, i) => `BT /F1 12 Tf 60 ${780 - i * 22} Td (${l.replace(/[()\\]/g, '\\$&')}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((o, i) => { offsets.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

writeFileSync(join(OUT, 'fictional-cv.pdf'), pdf(), 'latin1');

const s = newWorkspace();
s.profile.name = LINES[0];
s.cv.headline = LINES[1];
s.cv.experience = LINES[3] + '\n' + LINES[4];
s.cv.languages = LINES[5];
s.cv.reviewed = true;
writeFileSync(join(OUT, 'fictional-cv.docx'), buildCvDocx(s));
writeFileSync(join(OUT, 'fictional-cv.txt'), LINES.join('\n') + '\n');
console.log('Wrote tests/fixtures/cv/fictional-cv.{pdf,docx,txt}');
