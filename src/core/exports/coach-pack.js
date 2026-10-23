// @ts-check
/**
 * Coach view files (FR-COACH). No account, no server, nothing uploaded.
 *  - Coach pack: ONE self-contained HTML file. Opened in a browser, it shows the
 *    work pack; opened in Career Navigator, it shows the read-only coach view
 *    (the workspace is embedded as JSON). Optional passphrase (Web Crypto).
 *  - Coach notes: a small JSON file the coach sends back. Importing it ADDS
 *    notes beside the job seeker's work and never changes their data.
 */
import { documentHTML, packBody, escapeHTML } from './html.js';
import { parseWorkspace } from '../backup.js';
import { newWorkspace, normalizeWorkspace } from '../schema.js';
import { encryptText, decryptText } from '../crypto.js';

export const PACK_FORMAT = 'career-navigator-coach-pack';
export const NOTES_FORMAT = 'career-navigator-coach-notes';
export const MAX_PACK_BYTES = 4 * 1024 * 1024;

/** Warning shown on both sides (FR-COACH-4). */
export const SHARING_WARNING = 'This file contains personal details. Share it only with people you trust, and delete it when you no longer need it.';

/**
 * @param {any} state
 * @param {{ interviewQuestions?: any[] }} content
 * @param {{ passphrase?: string, now?: Date }} [opts]
 * @returns {Promise<string>} the HTML file
 */
export async function buildCoachPack(state, content, opts = {}) {
  const workspace = { ...state, settings: { ...state.settings, remember: false }, coachNotes: [] };
  const json = JSON.stringify(workspace);
  /** @type {Record<string, any>} */
  const payload = { format: PACK_FORMAT, version: 1, createdAt: (opts.now || new Date()).toISOString().slice(0, 10) };
  let body = '<p class="banner"><strong>Coach pack.</strong> ' + escapeHTML(SHARING_WARNING) + ' A coach can open this file in Career Navigator (Open a coach pack) to add notes. Nothing is uploaded.</p>';
  if (opts.passphrase) {
    payload.encrypted = true;
    payload.box = await encryptText(json, opts.passphrase);
    body += '<h1>Protected coach pack</h1><p>This coach pack is protected with a passphrase. Open it in Career Navigator → Open a coach pack, and enter the passphrase the job seeker gave you (not in the same message as this file).</p>';
  } else {
    payload.encrypted = false;
    payload.workspace = workspace;
    body += packBody(state, content);
  }
  // The JSON is data, not code: the file's own CSP blocks all scripts, and "<" is written as a
  // JSON unicode escape, so "</script>" can never appear inside the data.
  const BACKSLASH = String.fromCharCode(92);
  const data = JSON.stringify(payload).split('<').join(BACKSLASH + 'u003c')
    .split(String.fromCharCode(0x2028)).join(BACKSLASH + 'u2028')
    .split(String.fromCharCode(0x2029)).join(BACKSLASH + 'u2029');
  return documentHTML('Career Navigator — coach pack', body + '\n<script type="application/json" id="career-navigator-coach-pack">' + data + '</script>');
}

/**
 * Reads a coach pack file without trusting it: size cap, format check, and the
 * embedded workspace goes through the normal backup validation.
 * @param {string} html
 * @returns {{ encrypted: boolean, box?: any, workspace?: any } | null} null when this is not a coach pack
 */
export function readCoachPack(html) {
  if (typeof html !== 'string' || html.length > MAX_PACK_BYTES) throw new Error('This coach pack is too large.');
  const m = html.match(/<script type="application\/json" id="career-navigator-coach-pack">([\s\S]*?)<\/script>/);
  if (!m) return null;
  let payload;
  try { payload = JSON.parse(m[1]); } catch (_) { throw new Error('This coach pack is damaged.'); }
  if (!payload || payload.format !== PACK_FORMAT || payload.version !== 1) throw new Error('This is not a Career Navigator coach pack.');
  return payload.encrypted ? { encrypted: true, box: payload.box } : { encrypted: false, workspace: payload.workspace };
}

/**
 * @param {string} html
 * @param {string} [passphrase]
 * @returns {Promise<import('../schema.js').Workspace>} validated, read-only copy for the coach view
 */
export async function openCoachPack(html, passphrase) {
  const pack = readCoachPack(html);
  if (!pack) throw new Error('This is not a Career Navigator coach pack.');
  const json = pack.encrypted ? await decryptText(pack.box, passphrase || '') : JSON.stringify(pack.workspace);
  return parseWorkspace(json);
}

/**
 * The file a coach sends back.
 * @param {{ id: string, section: string, note: string }[]} notes
 * @param {{ coach?: string, now?: Date }} [opts]
 */
export function buildCoachNotes(notes, opts = {}) {
  const date = (opts.now || new Date()).toISOString().slice(0, 10);
  const clean = notes.filter((n) => n.note.trim()).map((n) => ({ id: n.id, section: n.section, note: n.note.trim(), coach: opts.coach || '', date }));
  // Validate with the same rules the job seeker's import uses.
  normalizeWorkspace({ ...newWorkspace(), coachNotes: clean });
  return JSON.stringify({ format: NOTES_FORMAT, version: 1, createdAt: date, notes: clean }, null, 2);
}

/**
 * @param {string} text
 * @returns {any[] | null} validated notes, or null when this is not a coach-notes file
 */
export function readCoachNotes(text) {
  let data;
  try { data = JSON.parse(text); } catch (_) { return null; }
  if (!data || data.format !== NOTES_FORMAT) return null;
  if (data.version !== 1) throw new Error('These coach notes come from a newer version of Career Navigator.');
  return normalizeWorkspace({ ...newWorkspace(), coachNotes: data.notes }).coachNotes;
}
