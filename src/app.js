// @ts-check
/**
 * The app controller: holds the store, routes between pages, renders with
 * lit-html and connects side effects (device saving, files, notices).
 * Ported from the v0.1 UI script. Pages stay small and only build templates.
 */
import { render } from 'lit-html';
import { createStore } from './store.js';
import { newWorkspace, normalizeWorkspace } from './core/schema.js';
import { parseWorkspace, serializeWorkspace } from './core/backup.js';
import { content } from './content/index.js';
import { createT, languageDir } from './i18n/index.js';
import { shell } from './components/shell.js';
import { download } from './lib/download.js';
import * as device from './storage/device.js';
import { renderHome } from './pages/home.js';
import { renderProfile } from './pages/profile.js';
import { renderJobs } from './pages/jobs.js';
import { renderCV } from './pages/cv.js';
import { renderInterview } from './pages/interview.js';
import { renderPlan } from './pages/plan.js';
import { renderStudio } from './pages/studio.js';
import brand from '../config/brand.json';
import features from '../config/features.json';
import pkg from '../package.json';

/** Pages and their navigation entries, in v0.1 order. Modules add themselves through `extensions`. */
const PAGES = [
  { id: 'home', label: 'Overview', icon: 'home', render: renderHome },
  { id: 'profile', label: 'My profile', icon: 'person', render: renderProfile },
  { id: 'jobs', label: 'Compare jobs', icon: 'briefcase', render: renderJobs },
  { id: 'cv', label: 'My application', icon: 'document', render: renderCV },
  { id: 'interview', label: 'Interview practice', icon: 'chat', render: renderInterview },
  { id: 'plan', label: 'My 90-day plan', icon: 'path', render: renderPlan },
  { id: 'prompts', label: 'AI prompt studio', icon: 'spark', render: renderStudio },
];

/**
 * True when the user has entered anything worth protecting. Ported from v0.1 hasWork.
 * @param {any} s
 */
export function hasWork(s) {
  return Boolean(Object.values(s.profile).some((v) => (Array.isArray(v) ? v.length : typeof v === 'object' ? Object.values(v).some(Boolean) : v))
    || s.jobs.length || Object.entries(s.cv).some(([k, v]) => k !== 'reviewed' && k !== 'linkedin' && v)
    || ['targetRole', 'project', 'day30', 'day60', 'day90', 'nextAction', 'nextDate'].some((k) => s.plan[k]) || s.plan.priorities.some(Boolean)
    || Object.values(s.interview.answers).some(Boolean) || Object.values(s.interview.notes).some(Boolean)
    || Object.values(s.ai.drafts).some(Boolean) || s.ai.extra || s.applications.length);
}

/**
 * Starts the app inside `root`.
 * @param {HTMLElement} root
 * @param {{ extensions?: ((app: any) => void)[] }} [options] modules that add pages or services
 */
export function startApp(root, options = {}) {
  const store = createStore(newWorkspace());
  const notice = /** @type {HTMLElement} */ (document.getElementById('notice'));
  const importInput = /** @type {HTMLInputElement} */ (document.getElementById('import-file'));
  /** @type {Record<string, any>} */
  const ui = { cvPreview: false, storageError: '' };
  /** @type {Record<string, any>} */
  const services = { version: pkg.version, features };
  const pages = [...PAGES];
  let view = viewFromHash();
  /** @type {string | null} */
  let pendingFocus = null;
  let noticeTimer = 0;
  let saving = Promise.resolve();

  applyBrandColours();

  function viewFromHash() {
    const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'home';
    return pages.some((p) => p.id === id) ? id : 'home';
  }

  /** @param {string} message @param {boolean} [error] */
  function notify(message, error = false) {
    clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.className = 'notice visible' + (error ? ' error' : '');
    noticeTimer = window.setTimeout(() => notice.classList.remove('visible'), error ? 12000 : 6500);
  }

  /** @returns {import('./app-context.js').Ctx & { focusAfterRender: (id: string) => void }} */
  function ctx() {
    const state = store.getState();
    const t = createT(state.settings.uiLanguage);
    return {
      state, content, ui, services, t,
      dispatch(action) { const r = store.dispatch(action); if (!r.ok) notify(t(r.error), true); return r.ok; },
      update(path, value) { const r = store.update(path, value); if (!r.ok) { notify(t(r.error), true); rerender(); } return r.ok; },
      go, notify, rerender,
      confirm: (message) => window.confirm(message),
      download,
      // dispatch() re-renders synchronously, so the target usually exists already;
      // the microtask also covers changes that render later in the same tick.
      focusAfterRender(id) { pendingFocus = id; queueMicrotask(applyFocus); },
    };
  }

  function applyFocus() {
    if (!pendingFocus) return;
    const target = pendingFocus === 'h1' ? document.querySelector('h1') : document.getElementById(pendingFocus);
    pendingFocus = null;
    /** @type {HTMLElement | null} */ (target)?.focus();
  }

  function rerender() {
    const c = ctx();
    const page = pages.find((p) => p.id === view) || pages[0];
    document.documentElement.lang = c.state.settings.uiLanguage;
    document.documentElement.dir = languageDir(c.state.settings.uiLanguage);
    render(shell(c, pages.filter((p) => !p.hidden), view, page.render(c)), root);
    applyFocus();
  }

  /** @param {string} next @param {{ focus?: boolean }} [opts] */
  function go(next, opts = {}) {
    view = pages.some((p) => p.id === next) ? next : 'home';
    if (location.hash !== '#/' + view) history.replaceState(null, '', '#/' + view);
    if (opts.focus !== false) pendingFocus = 'h1';
    rerender();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /** Replaces the workspace (demo, new, import). Device saving always switches off, like v0.1. */
  async function replaceWorkspace(/** @type {any} */ next, /** @type {string} */ message) {
    next.settings.remember = false;
    ui.cvPreview = false;
    store.dispatch({ type: 'replace', state: next });
    try { await device.clearSaved(); ui.storageError = ''; notify(createT(next.settings.uiLanguage)(message)); }
    catch (_) { notify(ctx().t('The workspace was changed here, but this browser did not allow removal of earlier saved data. Clear this app’s site data in browser settings.'), true); }
  }

  Object.assign(services, {
    store,
    replaceWorkspace,
    hasWork: () => hasWork(store.getState()),
    loadDemo() {
      const t = ctx().t;
      if (hasWork(store.getState()) && !window.confirm(t('Replace this workspace with the fictional example? Download a backup first if you want to keep your current work.'))) return;
      const demo = normalizeWorkspace(content.demo);
      demo.settings.uiLanguage = store.getState().settings.uiLanguage;
      demo.settings.onboarded = true;
      replaceWorkspace(demo, 'Fictional example loaded. Explore freely, then choose “Start my own”.').then(() => go('home'));
    },
    startOwn() {
      const t = ctx().t;
      if (!window.confirm(t('Start a clean workspace? This removes the fictional example and any edits you made to it.'))) return;
      const fresh = newWorkspace();
      fresh.settings.uiLanguage = store.getState().settings.uiLanguage;
      fresh.settings.onboarded = true;
      replaceWorkspace(fresh, 'Your own workspace is ready.').then(() => go('profile'));
    },
    reset() {
      const t = ctx().t;
      if (!window.confirm(t('Clear this workspace and its saved data in this browser? Download a backup first if you want to keep it. Downloaded files and AI chats are not deleted.'))) return;
      replaceWorkspace(newWorkspace(), 'Workspace cleared.').then(() => go('home'));
    },
    async deleteEverything() {
      const t = ctx().t;
      if (!window.confirm(t('Delete everything Career Navigator stored in this browser: your workspace, saved AI keys and offline files? This cannot be undone. Downloaded files are not affected.'))) return;
      await services.beforeDeleteEverything?.();
      await device.deleteEverything();
      store.dispatch({ type: 'replace', state: newWorkspace() });
      notify(t('Everything this app stored in this browser has been deleted.'));
      go('home');
    },
    exportBackup() {
      const state = store.getState();
      try {
        download(state.demo ? 'career-navigator-fictional-example.json' : 'career-navigator-backup.json', serializeWorkspace(state), 'application/json');
        notify(ctx().t('Backup downloaded. It contains your workspace text; keep it private.'));
      } catch (error) { notify(/** @type {Error} */ (error).message, true); }
    },
    importBackup() { importInput.click(); },
    async setRemember(/** @type {boolean} */ on) {
      const t = ctx().t;
      store.update('settings.remember', on);
      if (on) {
        try { await device.save(store.getState()); ui.storageError = ''; notify(t('Workspace saved on this device. You can turn this off at any time.')); }
        catch (_) { store.update('settings.remember', false); ui.storageError = t('Device save failed — download a backup'); notify(t('Your latest work could not be saved on this device. Download a backup before closing this page.'), true); }
      } else {
        // Clear through the same queue as saves, so a save still in flight cannot write the data back.
        saving = saving.then(() => device.clearSaved());
        try { await saving; notify(t('Device saving is off. Download a backup before closing this page.')); }
        catch (_) { notify(t('This browser could not remove the earlier saved copy. Clear this app’s site data in browser settings.'), true); }
      }
      rerender();
    },
  });

  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const t = ctx().t;
    try {
      if (file.size > 1048576) throw new Error(t('This backup is larger than one MiB. Choose a smaller Career Navigator backup.'));
      const text = await file.text();
      if (services.importOther && (await services.importOther(file, text))) return;
      const next = parseWorkspace(text);
      if (hasWork(store.getState()) && !window.confirm(t('Import this backup and replace your current workspace? Download your current work first if you want to keep it.'))) return;
      await replaceWorkspace(next, 'Backup imported. Device saving is off and your CV needs a fresh review.');
      go('home');
    } catch (error) {
      notify(t('Import could not be completed.') + ' ' + /** @type {Error} */ (error).message + ' ' + t('Your current work has been kept.'), true);
    } finally { importInput.value = ''; }
  });

  store.subscribe((state, action) => {
    rerender();
    if (state.settings.remember && action.type !== 'replace') {
      // Re-check at write time: the user may have switched saving off meanwhile.
      saving = saving.then(() => (store.getState().settings.remember ? device.save(store.getState()) : undefined)).catch(() => {
        store.update('settings.remember', false);
        ui.storageError = ctx().t('Device save failed — download a backup');
        notify(ctx().t('Your latest work could not be saved on this device. Download a backup before closing this page.'), true);
      });
    }
  });
  window.addEventListener('hashchange', () => { const next = viewFromHash(); if (next !== view) go(next); });

  const app = { store, pages, services, ui, ctx, rerender, go, notify };
  for (const extend of options.extensions || []) extend(app);
  view = viewFromHash();
  rerender();

  device.loadSaved().then(({ state, message }) => {
    if (state) { store.dispatch({ type: 'replace', state }); notify(ctx().t(message)); }
    services.afterStart?.();
  }).catch(() => {
    ui.storageError = ctx().t('Saved data unavailable — import a backup if needed');
    rerender();
    notify(ctx().t('Saved data could not be opened. You can work here and download a backup; your saved copy has not been overwritten.'), true);
    services.afterStart?.();
  });
  return app;
}

function applyBrandColours() {
  // CSSOM changes are allowed by the CSP (unlike inline style attributes).
  const root = document.documentElement.style;
  if (brand.colors?.deep) root.setProperty('--deep', brand.colors.deep);
  if (brand.colors?.teal) root.setProperty('--teal', brand.colors.teal);
  if (brand.colors?.lime) root.setProperty('--lime', brand.colors.lime);
}
