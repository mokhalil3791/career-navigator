// @ts-check
/**
 * The "context" object every page receives. It is how pages read the workspace
 * and ask for changes, without importing the store directly.
 *
 * @typedef {object} Ctx
 * @property {import('./core/schema.js').Workspace} state   current workspace (read-only)
 * @property {import('./content/build.js').Content} content  roles, prompts, questions, demo
 * @property {(action: import('./core/reducers.js').Action) => boolean} dispatch  apply a change; shows a notice on error
 * @property {(path: string, value: unknown) => boolean} update  change one field
 * @property {(view: string, opts?: { focus?: boolean }) => void} go  navigate to a page
 * @property {(message: string, error?: boolean) => void} notify  show a polite status message
 * @property {(english: string, params?: Record<string, unknown>) => string} t  translate
 * @property {(message: string) => boolean} confirm  ask yes/no
 * @property {(filename: string, text: string | Blob, type?: string) => void} download  save a file
 * @property {Record<string, any>} ui  screen-only state that is never saved (e.g. "show preview")
 * @property {() => void} rerender
 * @property {(id: string) => void} focusAfterRender  move keyboard focus after the next render ('h1' or an element id)
 * @property {Record<string, any>} services  side-effect helpers (storage, AI, files), set up in app.js
 */
export {};
