// @ts-check
/** Entry point: loads styles, starts the app and the optional modules. */
import './styles/tokens.css';
import './styles/layout.css';
import './styles/app.css';
import './styles/print.css';
import { startApp } from './app.js';
import { extensions } from './modules/index.js';

startApp(/** @type {HTMLElement} */ (document.getElementById('app')), { extensions });
