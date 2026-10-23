// @ts-check
/**
 * DOCX export of the CV and letter (FR-CV-3), without a library: a .docx is a
 * ZIP of a few XML files. Same review gate as the HTML export (guardrail G3).
 * The file has no photo, date of birth, nationality or marital status: the
 * workspace has no such fields.
 */
import { createZip } from './zip.js';
import { CV_HEADINGS, cvLanguage } from './html.js';

/** XML-escape text. @param {unknown} value */
function x(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => /** @type {Record<string,string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/** A paragraph; newlines inside the text become line breaks. @param {string} text @param {string} [style] */
function para(text, style) {
  const runs = String(text).split('\n').map((line, i) => (i ? '<w:r><w:br/></w:r>' : '') + `<w:r><w:t xml:space="preserve">${x(line)}</w:t></w:r>`).join('');
  return `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${runs}</w:p>`;
}

/** Text blocks separated by blank lines become separate paragraphs. @param {string} text */
function blocks(text) {
  return String(text || '').trim().split(/\n\s*\n/).map((b) => para(b)).join('');
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="60"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="123E3C"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="52646B"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="80"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="B8C5CA"/></w:pBdr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="123E3C"/></w:rPr></w:style>
</w:styles>`;

/**
 * @param {any} state the workspace
 * @returns {Uint8Array} the .docx file
 */
export function buildCvDocx(state) {
  if (!state || !state.cv || state.cv.reviewed !== true) throw new Error('Review every CV and letter claim, then mark the draft reviewed before exporting.');
  const cv = state.cv, p = state.profile, h = CV_HEADINGS[cvLanguage(state)];
  let body = '';
  if (state.demo) body += para('FICTIONAL EXAMPLE — practice data, not a real application.', 'Subtitle');
  body += para(p.name || h.cv, 'Title');
  if (cv.headline) body += para(cv.headline, 'Subtitle');
  const meta = [p.city, p.availability].filter(Boolean).join(' · ');
  if (meta) body += para(meta, 'Subtitle');
  for (const [title, key] of [[h.profile, 'summary'], [h.experience, 'experience'], [h.education, 'education'], [h.skills, 'skills'], [h.languages, 'languages']]) {
    if (cv[key] && cv[key].trim()) body += para(title, 'Heading1') + blocks(cv[key]);
  }
  if (cv.letter && cv.letter.trim()) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' + para(h.letter, 'Heading1') + blocks(cv.letter);
  const lang = cvLanguage(state) === 'Dutch' ? 'nl-NL' : 'en-GB';
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1021" w:right="1021" w:bottom="1021" w:left="1021" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return createZip([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>' },
    { name: 'docProps/core.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${x((p.name || 'My') + ' — CV')}</dc:title><dc:language>${lang}</dc:language></cp:coreProperties>` },
    { name: 'word/_rels/document.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'word/styles.xml', data: STYLES },
    { name: 'word/document.xml', data: document },
  ]);
}
