// @ts-check
/**
 * The app controller: holds the store, routes between pages, renders with
 * lit-html and connects side effects (device saving, files, notices).
 * Ported from the v0.1 UI script. Pages stay small and only build templates.
 */
import { render } from 'lit-html';
import { createStore } from './store.js';
import { newWorkspace, normalizeWorkspace } from './core/schema.js';
import { shouldAutoDraft, hasCvWork } from './core/auto-draft.js';
import { parseWorkspace, serializeWorkspace } from './core/backup.js';
import { content } from './content/index.js';
import { createT, languageDir } from './i18n/index.js';
import { shell } from './components/shell.js';
import { button } from './components/ui.js';
import { download } from './lib/download.js';
import * as device from './storage/device.js';
import { renderHome } from './pages/home.js';
import { renderProfile } from './pages/profile.js';
import { renderJobs } from './pages/jobs.js';
import { renderCV } from './pages/cv.js';
import { renderInterview } from './pages/interview.js';
import { renderPlan } from './pages/plan.js';
import { renderSettings } from './pages/settings.js';
import { renderStudio } from './pages/studio.js';
import brand from '../config/brand.json';
import features from '../config/features.json';
import pkg from '../package.json';

/** Pages and their navigation entries, in v0.1 order. Modules add themselves through `extensions`. */
const PAGES = [
  { id: 'settings', label: 'Settings', icon: 'compass', render: renderSettings },
  { id: 'home', label: 'Home', icon: 'home', render: renderHome },
  { id: 'profile', label: 'My story', icon: 'person', render: renderProfile },
  { id: 'jobs', label: 'Target job', icon: 'briefcase', render: renderJobs },
  { id: 'cv', label: 'My CV', icon: 'document', render: renderCV },
  { id: 'interview', label: 'Next steps', icon: 'chat', render: renderInterview },
  { id: 'plan', label: 'My 90-day plan', icon: 'path', render: renderPlan },
  { id: 'prompts', label: 'Prompt library', icon: 'spark', render: renderStudio },
];

/**
 * True when the user has entered anything worth protecting. Ported from v0.1 hasWork.
 * @param {any} s
 */
export function hasWork(s) {
  return Boolean(Object.values(s.profile).some((v) => (Array.isArray(v) ? v.length : typeof v === 'object' ? Object.values(v).some(Boolean) : v))
    || Object.values(s.cv.linkedin).some(Boolean) || s.jobs.length || Object.entries(s.cv).some(([k, v]) => k !== 'reviewed' && k !== 'autoDrafted' && k !== 'linkedin' && v)
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
  // Safari does not focus buttons on pointer clicks. Remember the actual trigger
  // before its handler opens a dialog so Close can restore keyboard focus.
  root.addEventListener('click', (event) => {
    ui.lastClickedButton = event.target instanceof Element ? event.target.closest('button') : null;
  }, true);
  /** @type {Record<string, any>} */
  const services = { version: pkg.version, features };
  const pages = [...PAGES];
  let view = viewFromHash();
  /** @type {string | null} */
  let pendingFocus = null;
  let noticeTimer = 0;
  let saving = Promise.resolve();
  /** @type {HTMLElement | null} */
  let journeyBar = null;
  // Toasts use the real bar height, including wrapped labels and the safe area.
  const barObserver = new ResizeObserver(syncBarHeight);
  function syncBarHeight() {
    const height = journeyBar && matchMedia('(max-width:720px)').matches ? journeyBar.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--journey-bar-height', `${height}px`);
  }

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
    setRootAttributes(c.state.settings.uiLanguage, c.state.settings.simpleLanguage);
    render(shell(c, pages.filter((p) => !p.hidden), view, page.render(c)), root);
    const sheet = /** @type {HTMLDialogElement | null} */ (root.querySelector('.ai-sheet'));
    if (sheet && !sheet.open) sheet.showModal();
    document.body.classList.toggle('ai-sheet-open', !!sheet);
    // A native dialog is above ordinary z-index layers, including the global toast.
    (sheet || document.body).appendChild(notice);
    const nextBar = /** @type {HTMLElement | null} */ (root.querySelector('.journey-footer'));
    if (nextBar !== journeyBar) {
      barObserver.disconnect(); journeyBar = nextBar;
      if (journeyBar) barObserver.observe(journeyBar);
    }
    syncBarHeight();
    applyFocus();
  }

  /** @param {string} next @param {{ focus?: boolean }} [opts] */
  function go(next, opts = {}) {
    view = pages.some((p) => p.id === next) ? next : 'home';
    if (location.hash !== '#/' + view) history.replaceState(null, '', '#/' + view);
    prepareCv();
    if (opts.focus !== false) pendingFocus = 'h1';
    rerender();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function prepareCv() {
    if (view !== 'cv') return;
    const state = store.getState();
    if (shouldAutoDraft(state)) {
      ui.firstDraft = true;
      store.dispatch({ type: 'autoDraftCv' });
    } else if (!state.cv.autoDrafted && hasCvWork(state)) {
      // Existing work consumes the opportunity too, so clearing it cannot trigger a refill.
      store.dispatch({ type: 'skipAutoDraft' });
    }
  }

  /** Replaces the workspace (demo, new, import). Device saving always switches off, like v0.1. */
  async function replaceWorkspace(/** @type {any} */ next, /** @type {string} */ message) {
    next.settings.remember = false;
    ui.cvPreview = false;
    ui.firstDraft = false; ui.cvTab = 'cv'; ui.cvDownloaded = false; ui.ai?.controller?.abort(); ui.ai = null;
    store.dispatch({ type: 'replace', state: next });
    try { await device.clearSaved(); ui.storageError = ''; notify(createT(next.settings.uiLanguage)(message)); }
    catch (_) { notify(ctx().t('The workspace was changed here, but this browser did not allow removal of earlier saved data. Clear this app’s site data in browser settings.'), true); }
  }

  Object.assign(services, {
    installButton(/** @type {any} */ context) {
      if (!ui.installEvent) return null;
      return button(context.t('Install app'), async () => {
        const event = ui.installEvent;
        ui.installEvent = null;
        await event.prompt();
        rerender();
      });
    },
    store,
    replaceWorkspace,
    hasWork: () => hasWork(store.getState()),
    loadDemo() {
      const t = ctx().t;
      if (hasWork(store.getState()) && !window.confirm(t('Replace this workspace with the fictional example? Download a backup first if you want to keep your current work.'))) return;
      const demo = normalizeWorkspace(content.demo);
      // The example takes the same first-draft path as a new workspace.
      demo.cv = newWorkspace().cv;
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
      ui.askToSave = false; ui.firstDraft = false; ui.legacyOffer = false; ui.ai?.controller?.abort(); ui.ai = null;
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
    bringLegacy() {
      const text = device.legacyBackup();
      if (!text) return;
      const t = ctx().t;
      if (hasWork(store.getState()) && !window.confirm(t('Import this backup and replace your current workspace? Download your current work first if you want to keep it.'))) return;
      // Keep the original localStorage copy until the person decides how to save.
      store.dispatch({ type: 'replace', state: parseWorkspace(text) });
      ui.legacyOffer = false;
      // Accepting an imported workspace is the first content change in this session.
      ui.sessionEdited = true; ui.savePromptSeen = true;
      ui.askToSave = true;
      rerender();
    },
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
      // Coach packs (.html) hold the workspace AND the rendered work pack, so they may be
      // larger than a backup; readCoachPack() enforces their own 4 MiB limit.
      const isHtml = /\.html?$/i.test(file.name);
      if (file.size > (isHtml ? 4 * 1048576 : 1048576)) throw new Error(isHtml ? t('This coach pack is too large.') : t('This backup is larger than one MiB. Choose a smaller Career Navigator backup.'));
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
    const edited = action.type !== 'replace' && (['profile.', 'cv.', 'plan.', 'interview.'].some(prefix => action.path?.startsWith(prefix)) || ['editJob', 'addJob', 'removeJob', 'addRow', 'editRow', 'removeRow', 'addRequirement', 'editRequirement', 'removeRequirement', 'setJobFacts', 'setCv', 'applyTemplate', 'startEmptyCv'].includes(action.type));
    if (edited) ui.sessionEdited = true;
    if (edited && !state.settings.remember && !ui.savePromptSeen) {
      ui.savePromptSeen = true; ui.askToSave = true;
    }
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
  window.addEventListener('focus', () => {
    if (ui.ai?.awaitingReturn) { ui.ai.awaitingReturn = false; ui.ai.pasteReady = true; rerender(); root.querySelector('[data-testid=paste-answer]')?.scrollIntoView({ block: 'center' }); }
  });
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); ui.installEvent = event; rerender(); });
  window.addEventListener('appinstalled', () => { ui.installEvent = null; rerender(); });

  const app = { store, pages, services, ui, ctx, rerender, go, notify };
  for (const extend of options.extensions || []) extend(app);
  view = viewFromHash();
  // lit-html's render() adds to the container and would leave the static
  // "Opening Career Navigator…" placeholder from index.html on screen.
  root.replaceChildren();
  rerender();

  device.loadSaved({ offerLegacy: true }).then(({ state, message, error }) => {
    if (state) {
      store.dispatch({ type: 'replace', state });
      prepareCv();
      if (error) ui.storageError = ctx().t('Device save failed — download a backup');
      notify(ctx().t(message), Boolean(error));
    }
    services.afterStart?.();
    ui.legacyOffer = Boolean(device.legacyBackup());
    rerender();
  }).catch(() => {
    ui.storageError = ctx().t('Saved data unavailable — import a backup if needed');
    rerender();
    notify(ctx().t('Saved data could not be opened. You can work here and download a backup; your saved copy has not been overwritten.'), true);
    services.afterStart?.();
    ui.legacyOffer = Boolean(device.legacyBackup());
    rerender();
  });
  return app;
}

/**
 * Updates lang, dir and the simple-language class on <html> ONLY when they change.
 * Rewriting them on every render invalidated the root style each keystroke, and in
 * WebKit this sometimes left descendants with stale var(--…) values: the dark
 * sidebar briefly computed as transparent (docs/KNOWN-ISSUES.md).
 * @param {string} lang
 * @param {boolean} simple
 */
function setRootAttributes(lang, simple) {
  const html = document.documentElement;
  const dir = languageDir(lang);
  if (html.lang !== lang) html.lang = lang;
  if (html.dir !== dir) html.dir = dir;
  if (html.classList.contains('simple') !== simple) html.classList.toggle('simple', simple);
}

function applyBrandColours() {
  // CSSOM changes are allowed by the CSP (unlike inline style attributes).
  const root = document.documentElement.style;
  if (brand.colors?.deep) root.setProperty('--deep', brand.colors.deep);
  if (brand.colors?.primary) root.setProperty('--primary', brand.colors.primary);
  if (brand.colors?.accent) root.setProperty('--accent', brand.colors.accent);
}
