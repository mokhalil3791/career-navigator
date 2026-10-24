import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map(m => [m[1], m[2]]));
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) { const x = luminance(tokens[a]), y = luminance(tokens[b]); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
describe('orange UI contrast', () => {
  for (const fg of ['ink', 'muted', 'deep', 'primary', 'danger']) for (const bg of ['white', 'paper', 'soft', 'soft-2']) {
    it(`${fg} text on ${bg}`, () => expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5));
  }
  for (const bg of ['deep', 'primary', 'primary-hover', 'success', 'danger']) it(`white on ${bg}`, () => expect(contrast('white', bg)).toBeGreaterThanOrEqual(4.5));
  it('sidebar secondary text', () => expect(contrast('soft', 'deep')).toBeGreaterThanOrEqual(4.5));
  it('compass on decorative accent', () => expect(contrast('deep', 'accent')).toBeGreaterThanOrEqual(3));
  for (const bg of ['white', 'paper', 'soft', 'soft-2']) for (const fg of ['control', 'focus']) it(`${fg} boundary on ${bg}`, () => expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3));
});
