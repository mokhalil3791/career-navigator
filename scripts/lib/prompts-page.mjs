// @ts-check
/**
 * Renders the public prompt library page (FR-LIB). Pure function, so tests can
 * check the exact HTML. No cookies, no storage, no remote fonts or scripts.
 */
import { escapeHTML as E, safeUrl } from '../../src/core/escape.js';
import { buildLibraryPrompt } from '../../src/core/library.js';

export const SITE_URL = 'https://mokhalil3791.github.io/career-navigator/';

/**
 * @param {import('../../src/core/library.js').PromptFile[]} prompts
 * @param {{ chats: { id: string, label: string, url: string }[] }} providers
 * @returns {string} complete HTML document
 */
export function renderPromptsPage(prompts, providers) {
  const chats = providers.chats
    .map((c) => ({ ...c, url: safeUrl(c.url) }))
    .filter((c) => c.url)
    .map((c) => `<a href="${E(c.url)}" target="_blank" rel="noopener noreferrer">${E(c.label)}</a>`)
    .join('');
  const cards = prompts.map((p, i) => {
    const text = buildLibraryPrompt(p);
    return `<article class="prompt" id="${E(p.slug)}">
  <header><span class="num">${i + 1}</span><div><h2>${E(p.title)}</h2><p>${E(p.summary)}</p></div></header>
  <p class="paste"><strong>Paste with it:</strong> ${p.pasteWith.map(E).join(' · ')}</p>
  <details class="full"><summary>Show the full prompt</summary><pre id="text-${E(p.slug)}" tabindex="0" aria-label="Full prompt: ${E(p.title)}">${E(text)}</pre></details>
  <div class="actions"><button type="button" class="btn" data-copy="text-${E(p.slug)}">Copy prompt</button><button type="button" class="btn secondary" data-share="text-${E(p.slug)}" hidden>Share to an app</button><a class="link" href="#${E(p.slug)}">Link to this prompt</a></div>
</article>`;
  }).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'">
<meta name="description" content="Free career prompts for any AI chat: build a Dutch-style CV, check a job advert, practise an interview. Evidence, not scores.">
<title>Career Navigator — free AI career prompts</title>
<link rel="stylesheet" href="./prompts.css">
</head>
<body>
<a class="skip" href="#main">Skip to prompts</a>
<header class="top"><a class="brand" href="../">Career Navigator</a><span class="tag">Free · no sign-up · nothing saved</span></header>
<main id="main">
<h1>Free AI career prompts</h1>
<p class="lead">Seven prompts for building your CV and finding work in the Netherlands. They work in any free AI chat. Each prompt asks the AI to stick to your real facts and to use evidence instead of scores.</p>
<ol class="how">
  <li><strong>Copy</strong> a prompt.</li>
  <li><strong>Open</strong> a free AI chat: <span class="chats">${chats}</span></li>
  <li><strong>Paste</strong> the prompt, then add your CV or the job advert where it says <em>[Paste here]</em>.</li>
  <li><strong>Check</strong> every claim in the answer. AI can make mistakes.</li>
</ol>
<p class="note"><strong>Your privacy:</strong> this page saves nothing and sends nothing. AI chats have their own terms. Leave out your BSN, passport or residence-permit details, and anything you would not want stored. To get explanations in another language, change the word <em>English</em> in the third paragraph of the prompt.</p>
${cards}
<section class="handout" aria-label="Printed handout">
  <img src="../qr/prompts.svg" alt="QR code linking to this page" width="132" height="132">
  <p>Open the full prompts on your phone:<br><strong>mokhalil3791.github.io/career-navigator/prompts</strong></p>
</section>
<p class="more">Want to keep your work in one place? Try the free <a href="../">Career Navigator workspace</a>: it runs in your browser, with no account.</p>
</main>
<footer>Career Navigator is an independent, open-source tool. No employer or partner endorsement is implied. Prompts © Career Navigator contributors, <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener noreferrer">CC BY 4.0</a>.</footer>
<script src="./prompts.js"></script>
</body>
</html>
`;
}

/**
 * A tiny redirect page for short slide URLs such as /p/cv.
 * @param {string} slug
 */
export function renderShortLink(slug) {
  const target = '../../prompts/#' + encodeURIComponent(slug);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0; url=${E(target)}"><title>Career Navigator prompt</title></head><body><p><a href="${E(target)}">Open the prompt</a></p></body></html>\n`;
}
