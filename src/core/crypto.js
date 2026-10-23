// @ts-check
/**
 * Optional passphrase protection for files people share by email or WhatsApp
 * (coach packs). Uses the browser's built-in Web Crypto: PBKDF2-SHA-256 to
 * turn the passphrase into a key, then AES-GCM. No library, no server.
 */

const ITERATIONS = 310000;

/** @param {Uint8Array} bytes */
const toB64 = (bytes) => btoa(String.fromCharCode(...bytes));
/** @param {string} b64 */
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/** @param {string} passphrase @param {Uint8Array} salt */
async function keyFrom(passphrase, salt) {
  // (casts: TypeScript's DOM types are stricter than the real Web Crypto API)
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: /** @type {BufferSource} */ (salt), iterations: ITERATIONS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/**
 * @param {string} text
 * @param {string} passphrase at least 8 characters
 * @returns {Promise<{ alg: 'PBKDF2-SHA256/AES-GCM', iterations: number, salt: string, iv: string, data: string }>}
 */
export async function encryptText(text, passphrase) {
  if (passphrase.length < 8) throw new Error('Use a passphrase of at least 8 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: /** @type {BufferSource} */ (iv) }, await keyFrom(passphrase, salt), new TextEncoder().encode(text));
  return { alg: 'PBKDF2-SHA256/AES-GCM', iterations: ITERATIONS, salt: toB64(salt), iv: toB64(iv), data: toB64(new Uint8Array(cipher)) };
}

/**
 * @param {{ salt: string, iv: string, data: string }} box
 * @param {string} passphrase
 */
export async function decryptText(box, passphrase) {
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: /** @type {BufferSource} */ (fromB64(box.iv)) }, await keyFrom(passphrase, fromB64(box.salt)), /** @type {BufferSource} */ (fromB64(box.data)));
    return new TextDecoder().decode(plain);
  } catch (_) {
    throw new Error('The passphrase is not correct, or the file was changed.');
  }
}
