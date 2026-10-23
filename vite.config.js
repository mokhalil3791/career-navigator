// @ts-check
/**
 * Vite builds the app into dist/ (served at /next/ on GitHub Pages until the
 * maintainer approves moving it to the root). Vitest uses the same config.
 */
import { defineConfig } from 'vite';
import { cspPlugin } from './scripts/lib/csp-plugin.mjs';

export default defineConfig({
  // Relative paths: the same build works at /next/, at the root, or from a USB stick.
  base: './',
  plugins: [cspPlugin()],
  build: {
    outDir: 'dist',
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/ai/**'],
      reporter: ['text-summary', 'text'],
      thresholds: { 'src/core/**': { lines: 90 } },
    },
  },
});
