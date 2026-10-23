// @ts-check
/**
 * "Redact before sending" (FR-AI-6). Masks personal details in the outgoing
 * text (emails, phone numbers, BSN-like numbers, bank account numbers,
 * postcodes, street addresses and the name) so a free-tier provider never sees them.
 * The preview shows the masked text, so what the user reads is exactly what is sent.
 * Pattern matching cannot catch everything; the UI says so.
 */

/** @type {{ label: string, mask: string, pattern: RegExp }[]} */
export const RULES = [
  { label: 'email addresses', mask: '[email]', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { label: 'bank account numbers', mask: '[bank account]', pattern: /\b[A-Z]{2}\d{2}[ ]?(?:[A-Z0-9]{4}[ ]?){2,7}[A-Z0-9]{1,4}\b/g },
  // Phone numbers: +31 6 12345678, 06-12345678, 0031 20 123 4567, (020) 123 4567, +44 7700 900123 …
  { label: 'phone numbers', mask: '[phone]', pattern: /(?:\+|00)\d{1,3}[\s.-]?(?:\(?\d{1,4}\)?[\s.-]?){2,5}\d{2,4}\b|\b0\d{1,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b|\(0\d{2,3}\)\s?\d{3}\s?\d{3,4}\b/g },
  // BSN-like: any 9-digit number, also written as 123.456.789 or 123 45 6789.
  { label: 'BSN-like numbers', mask: '[ID number]', pattern: /\b\d{3}[.\s]?\d{2,3}[.\s]?\d{3,4}\b/g },
  // Dutch postcode: 1234 AB
  { label: 'postcodes', mask: '[postcode]', pattern: /\b[1-9]\d{3}\s?[A-Z]{2}\b/g },
  // Street + house number: "Kerkstraat 12", "Laan van Meerdervoort 120-B", "12 Baker Street"
  { label: 'street addresses', mask: '[address]', pattern: /\b[A-Z][a-zà-ÿ]+(?:[ -][a-zà-ÿ]+){0,3}(?:straat|laan|weg|plein|gracht|kade|singel|dijk|steeg|hof|park|dreef|baan|markt|pad|street|road|avenue|lane)\s+\d{1,4}(?:\s?[-]?\s?[A-Za-z]{1,2}\b|\s?-\s?\d{1,3})?|\b\d{1,4}\s+[A-Z][a-z]+\s+(?:Street|Road|Avenue|Lane)\b/g },
];

/** @param {string} s */
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, (c) => '\\' + c);

/**
 * @param {string} text the outgoing prompt
 * @param {{ name?: string }} [options] the profile name to remove wherever it appears
 * @returns {{ text: string, counts: Record<string, number> }}
 */
export function redact(text, options = {}) {
  /** @type {Record<string, number>} */
  const counts = {};
  let out = text;
  // Patterns first: masking the name first would break e-mail addresses that contain it.
  for (const rule of RULES) {
    out = out.replace(rule.pattern, (match) => {
      // Keep years and short ranges such as "2014–2022" readable.
      if (rule.mask === '[ID number]' && /^(19|20)\d{2}\D?(19|20)\d{2}$/.test(match)) return match;
      counts[rule.label] = (counts[rule.label] || 0) + 1;
      return rule.mask;
    });
  }
  const name = (options.name || '').trim();
  if (name) {
    // Whole name, then each part of 3+ letters (first name, family name).
    const parts = [name, ...name.split(/[\s—–-]+/).filter((p) => p.length >= 3 && !/^(fictional|example)$/i.test(p))];
    for (const part of parts) {
      out = out.replace(new RegExp('\\b' + escapeRegExp(part) + '\\b', 'gi'), () => { counts.name = (counts.name || 0) + 1; return '[name]'; });
    }
  }
  return { text: out, counts };
}
