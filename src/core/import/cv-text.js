// @ts-check
/**
 * CV import (FR-PRO-2): extracts plain text from a PDF, DOCX or TXT file,
 * IN THE BROWSER ONLY. Nothing is uploaded. The text goes into "Paste an
 * existing CV", never into the structured fields (the user decides).
 */
import { readZipEntry } from '../exports/zip.js';

/** Largest CV file we read. */
export const MAX_CV_FILE_BYTES = 5 * 1024 * 1024;

/** @param {string} s */
function decodeXml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
}

/**
 * Text of a .docx: one line per paragraph, tabs and line breaks kept.
 * @param {Uint8Array} bytes
 */
export async function docxText(bytes) {
  const xml = await readZipEntry(bytes, 'word/document.xml');
  if (!xml) throw new Error('This DOCX has no document text.');
  const text = new TextDecoder().decode(xml);
  // Read only the text runs (<w:t>), tabs and breaks of each paragraph, instead of
  // stripping tags: nothing from the XML markup can end up in the result.
  const lines = text.split('</w:p>').map((paragraph) => {
    let line = '';
    for (const m of paragraph.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\b[^>]*\/>/g)) {
      if (m[1] !== undefined) line += decodeXml(m[1]);
      else line += m[0].startsWith('<w:tab') ? '\t' : '\n';
    }
    return line.replace(/[ \t]+$/g, '');
  });
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Text of a PDF with Mozilla pdf.js, loaded only when needed (approved dependency).
 * Scanned PDFs (images only) have no text; the caller explains that.
 * @param {Uint8Array} bytes
 */
export async function pdfText(bytes) {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  // We only read text: no fonts, no rendering. The strict CSP (no eval) stays in place.
  const task = pdfjs.getDocument(/** @type {any} */ ({ data: bytes, isEvalSupported: false, disableFontFace: true, useSystemFonts: false }));
  const doc = await task.promise;
  const pages = [];
  for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    let line = '', out = '';
    /** @type {number | null} */
    let lastY = null;
    for (const item of /** @type {any[]} */ (content.items)) {
      const y = item.transform ? Math.round(item.transform[5]) : lastY;
      if (lastY !== null && y !== lastY) { out += line.trim() + '\n'; line = ''; }
      line += item.str + (item.hasEOL ? '\n' : '');
      lastY = y;
    }
    pages.push((out + line).trim());
  }
  await task.destroy();
  return pages.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractCvText(file) {
  if (file.size > MAX_CV_FILE_BYTES) throw new Error('This file is larger than 5 MB. Choose a smaller CV file.');
  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text;
  if (name.endsWith('.txt') || file.type === 'text/plain') text = new TextDecoder().decode(bytes);
  else if (name.endsWith('.docx')) text = await docxText(bytes);
  else if (name.endsWith('.pdf') || file.type === 'application/pdf') text = await pdfText(bytes);
  else throw new Error('Choose a PDF, DOCX or TXT file. Old .doc files: save them as .docx first.');
  text = text.trim();
  if (!text) throw new Error('No text was found in this file. If it is a scanned image, type or paste your CV instead.');
  return text.slice(0, 30000);
}
