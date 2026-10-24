// G14: workspace text must never travel in a generated chat URL.
import { describe, it, expect } from 'vitest';
import { CHATS, chosenChat, chatHomepage } from '../../src/ai/chats.js';
import { readFileSync } from 'node:fs';
import { allTextFiles } from '../helpers/files.js';
describe('G14: workspace handoffs contain no personal text in URLs', () => {
  it('every generated chat link is a bare homepage regardless of workspace content', () => {
    const privateText = 'PRIVATE_PROFILE_CV_ADVERT';
    for (const chat of CHATS) {
      const url = chosenChat({ aiChat: chat.id, aiChatUrl: `https://example.org/${privateText}?q=${privateText}#${privateText}`, profile: privateText, cv: privateText, advert: privateText }).url;
      expect(url).not.toContain(privateText);
      expect(new URL(url).search).toBe(''); expect(new URL(url).hash).toBe(''); expect(new URL(url).pathname).toBe('/');
    }
    expect(chatHomepage('javascript:alert(1)')).toBe('');
    expect(chatHomepage('https://user:secret@example.org')).toBe('');
  });
  it('workspace UI has no prompt-prefill builders; only the static library can build them', () => {
    for (const file of allTextFiles(['src']).filter(f => f.endsWith('.js'))) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/\.prefill|encodeURIComponent\((?:text|prompt)\)/);
    }
  });
});
