import { describe, it, expect } from 'vitest';
import { runInNewContext } from 'node:vm';
import { redirectScript } from '../../scripts/lib/legacy-redirect.mjs';

describe('old-address cleanup stays within its own scope', () => {
  it('keeps unrelated registrations and mixed-cache entries and preserves the route', async () => {
    const root = 'https://example.test/career-navigator/', old = root + 'next/';
    const unregistered = [], removed = [], entries = [];
    const records = { 'career-navigator-app-old': [old + 'index.html'], 'career-navigator-app-mixed': [old + 'asset.js', root + 'asset.js'], 'other-project': [old + 'unowned.js'] };
    let destination = '';
    const link = {};
    await runInNewContext(redirectScript, {
      URL, location: { href: old + '#/cv', hash: '#/cv', replace: value => { destination = value; } },
      document: { querySelector: () => link },
      navigator: { serviceWorker: { getRegistrations: async () => [old, root, 'https://example.test/other/'].map(scope => ({ scope, unregister: async () => unregistered.push(scope) })) } },
      caches: { keys: async () => Object.keys(records), delete: async name => removed.push(name), open: async name => ({ keys: async () => records[name].map(url => ({ url })), delete: async request => entries.push(request.url) }) },
    });
    expect(unregistered).toEqual([old]);
    expect(removed).toEqual(['career-navigator-app-old']);
    expect(entries).toEqual([old + 'asset.js']);
    expect(destination).toBe(root + '#/cv'); expect(link.href).toBe(destination);
  });
  it('still redirects when browser storage is blocked', async () => {
    let destination = '';
    await runInNewContext(redirectScript, { URL, document: { querySelector: () => ({}) }, navigator: {},
      location: { href: 'https://example.test/career-navigator/next/', hash: '', replace: value => { destination = value; } },
      caches: { keys: async () => { throw new Error('blocked'); } },
    });
    expect(destination).toBe('https://example.test/career-navigator/');
  });
});
