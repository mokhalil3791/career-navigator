// @ts-check
/**
 * A tiny frontmatter reader for content files. It understands only what our
 * content uses: `key: value`, quoted strings, numbers, true/false, and lists
 * written as `- item` lines (including lists of `key: value` objects).
 * We write our own instead of adding a YAML library, to keep dependencies at zero.
 */

/**
 * @param {string} raw a value written after `key:`
 * @returns {string | number | boolean}
 */
function scalar(raw) {
  const value = raw.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }
  return value;
}

/**
 * Splits a Markdown file into its frontmatter data and body.
 * @param {string} text the whole file
 * @returns {{ data: Record<string, any>, body: string }}
 */
export function parseFrontmatter(text) {
  const normalised = text.replace(/\r\n/g, '\n');
  const match = normalised.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('Missing frontmatter block (--- at the top of the file)');
  /** @type {Record<string, any>} */
  const data = {};
  /** @type {string | null} */
  let listKey = null;
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      const pair = item[1].match(/^([A-Za-z][\w-]*):\s+(.*)$/);
      if (pair) data[listKey].push({ [pair[1]]: scalar(pair[2]) });
      else data[listKey].push(scalar(item[1]));
      continue;
    }
    const nested = line.match(/^\s{4,}([A-Za-z][\w-]*):\s+(.*)$/);
    if (nested && listKey && data[listKey].length) {
      // Continuation of the last object in a list, e.g. "    url: https://…"
      const last = data[listKey][data[listKey].length - 1];
      if (last && typeof last === 'object') { last[nested[1]] = scalar(nested[2]); continue; }
    }
    const pair = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!pair) throw new Error('Cannot read frontmatter line: ' + line);
    if (pair[2] === '') { data[pair[1]] = []; listKey = pair[1]; }
    else { data[pair[1]] = scalar(pair[2]); listKey = null; }
  }
  return { data, body: match[2].trim() };
}
