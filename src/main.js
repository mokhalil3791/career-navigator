// @ts-check
/** Entry point: loads styles, starts the app and the optional modules. */
import './styles/tokens.css';
import './styles/layout.css';
import './styles/app.css';
import './styles/print.css';
import { startApp } from './app.js';
import { extensions } from './modules/index.js';

startApp(/** @type {HTMLElement} */ (document.getElementById('app')), { extensions });

// Offline support (installable PWA). Only on the hosted site: not in development,
// and not when the single-file version is opened from a USB stick (file://).
if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol !== 'file:' && !import.meta.env.VITE_SINGLE_FILE) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => { /* offline mode is optional */ }); });
}
