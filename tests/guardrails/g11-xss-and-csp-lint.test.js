// GUARDRAIL G11 — NFR-SEC-3: all live UI goes through escaping templates (lit-html).
// Also keeps the strict CSP working (no inline styles in templates). Never delete or weaken.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../scripts/lib/content.mjs';
import { allTextFiles } from '../helpers/files.js';
import { contentSecurityPolicy } from '../../scripts/lib/csp-plugin.mjs';

// Files that build downloadable documents as escaped strings (not live DOM).
const STRING_DOCUMENT_FILES = ['src/core/exports/html.js', 'src/core/exports/coach-pack.js'];

describe('G11: no raw HTML injection in live UI', () => {
  it('src/ never uses innerHTML, outerHTML, insertAdjacentHTML, unsafeHTML, eval or new Function', () => {
    for (const file of allTextFiles(['src']).filter((f) => f.endsWith('.js'))) {
      const text = readFileSync(join(ROOT, file), 'utf8');
      expect(text.match(/\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML|unsafeHTML|unsafeSVG|\beval\(|new Function\(|document\.write/)?.[0], file).toBeUndefined();
    }
  });
  it('templates never use inline style attributes (the CSP blocks them)', () => {
    for (const file of allTextFiles(['src']).filter((f) => f.endsWith('.js') && !STRING_DOCUMENT_FILES.includes(f))) {
      expect(readFileSync(join(ROOT, file), 'utf8').match(/\sstyle=["'$]/)?.[0], file).toBeUndefined();
    }
  });
  it('the CSP allows no remote scripts, styles or fonts, and no inline script', () => {
    const csp = contentSecurityPolicy();
    expect(csp).toContain("default-src 'none'");
    expect(csp).toMatch(/script-src 'self' 'wasm-unsafe-eval';/);
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toMatch(/style-src 'self';/);
    expect(csp).toMatch(/font-src 'self';/);
  });
  it('every connect-src host is https or localhost, and belongs to a configured free provider', () => {
    const connect = contentSecurityPolicy().split('; ').find((d) => d.startsWith('connect-src')) || '';
    for (const host of connect.split(' ').slice(1)) expect(host).toMatch(/^('self'|https:\/\/[a-z0-9.-]+|http:\/\/(localhost|127\.0\.0\.1):\d+)$/);
  });
});
