// GUARDRAIL G12 — repository policy: approved runtime dependencies only (fewer than 5),
// AGENTS.md and CLAUDE.md identical, safety features not switchable. Never delete or weaken.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../scripts/lib/content.mjs';

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

/** Runtime dependencies the maintainer approved (2026-10-23). Adding one needs maintainer approval. */
const APPROVED_RUNTIME = ['lit-html', '@mlc-ai/web-llm', 'pdfjs-dist'];

describe('G12: repository policy', () => {
  it('runtime dependencies are approved and fewer than 5 (NFR-SEC-7)', () => {
    const deps = Object.keys(pkg.dependencies || {});
    expect(deps.length).toBeLessThan(5);
    for (const d of deps) expect(APPROVED_RUNTIME, d + ' is not an approved runtime dependency').toContain(d);
  });
  it('dependency versions are pinned exactly', () => {
    for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) expect(String(version), name).toMatch(/^\d+\.\d+\.\d+/);
  });
  it('AGENTS.md and CLAUDE.md have the same content (FR-FORK-2)', () => {
    expect(readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8')).toBe(readFileSync(join(ROOT, 'AGENTS.md'), 'utf8'));
  });
  it('core safety features cannot be switched off in config/features.json', () => {
    const features = JSON.parse(readFileSync(join(ROOT, 'config', 'features.json'), 'utf8'));
    for (const key of Object.keys(features)) expect(key).not.toMatch(/review|safeguard|guard|redact|preview|confirm|omit|network|csp|importReset|privacy/i);
  });
  it('no analytics or tracking code anywhere in shipped files', () => {
    const files = ['index.html', 'src/app.js', 'src/main.js'];
    for (const f of files) expect(readFileSync(join(ROOT, f), 'utf8')).not.toMatch(/google-analytics|gtag\(|plausible|matomo|segment\.com|hotjar|sentry/i);
  });
});
