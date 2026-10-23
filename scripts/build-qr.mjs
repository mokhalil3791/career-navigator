// @ts-check
/**
 * Generates QR codes for slides and the printed handout (FR-LIB-5).
 * Uses the `qrcode` package at build time only; nothing ships to users but SVG files.
 * Run: npm run build:qr  (commit the results in assets/qr/)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { ROOT } from './lib/content.mjs';
import { SITE_URL } from './lib/prompts-page.mjs';

const targets = { app: SITE_URL, prompts: SITE_URL + 'prompts/' };
mkdirSync(join(ROOT, 'assets', 'qr'), { recursive: true });
for (const [name, url] of Object.entries(targets)) {
  const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: '#123e3cff', light: '#ffffffff' } });
  writeFileSync(join(ROOT, 'assets', 'qr', name + '.svg'), svg);
  console.log('assets/qr/' + name + '.svg → ' + url);
}
