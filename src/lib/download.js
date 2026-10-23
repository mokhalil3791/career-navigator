// @ts-check
/**
 * Saves a file to the user's device. Nothing is uploaded. Ported from v0.1.
 * @param {string} filename
 * @param {string | Blob} content
 * @param {string} [type]
 */
export function download(filename, content, type = 'text/html;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
