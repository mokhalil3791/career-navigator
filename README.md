# Career Navigator

A free, private career workspace for newcomers to the Netherlands. Build a truthful Dutch-style CV,
compare job adverts with your own evidence, practise interviews and make a 90-day learning plan.
Everything runs in your browser.

- **Open the app (workshop version, v0.1):** https://mokhalil3791.github.io/career-navigator/
- **Try the new version (v1 preview):** https://mokhalil3791.github.io/career-navigator/next/ (works offline, can be installed on your phone, English and Dutch)
- **Free AI career prompts:** https://mokhalil3791.github.io/career-navigator/prompts/
- **Short links for slides:** `…/career-navigator/p/cv`, `/p/check`, `/p/tailor`, `/p/interview`, `/p/letter`, `/p/jobs`, `/p/compare`
- **QR codes:** [`assets/qr/app.svg`](assets/qr/app.svg) and [`assets/qr/prompts.svg`](assets/qr/prompts.svg)

**Free forever.** No account, no payment, no trial and no analytics. You never need a payment card.

## How the free AI help works (copy-paste)

Career Navigator never needs a paid AI. You use the free plan of an AI chat you already have, such as
Claude, Gemini, Le Chat, Copilot, ChatGPT or Duck.ai.

1. In the app, open **AI prompt studio** (or open the **prompt library** page).
2. Choose a prompt, for example *Check one job*. The app adds your profile facts and the job advert.
   It never adds the name field, and it adds safety rules: no invented facts and no match scores.
3. **Read the exact text** that will be copied. Remove anything you do not want to share.
4. Press **Copy this prompt**. Open your free AI chat and paste it.
5. Copy the AI's answer and paste it back into **Bring back a draft**. It is an *unverified draft*:
   check every claim before you use it in your CV.

On a phone, the prompt library also has a **Share** button. It sends the prompt straight to an installed AI chat app.

**Structured round trip:** for jobs like *Extract requirements* or *Tailor my CV*, the prompt asks the chat to
end with a small JSON block. Paste the whole reply back and the app turns it into suggestions. You accept,
edit or reject each one. Nothing changes until you click **Accept**.

## Built-in free AI (optional)

In **AI prompt studio → Free AI routes** you can also connect a free AI directly. You always see the exact
text and where it goes before anything is sent, and **Redact before sending** masks emails, phone
numbers, BSN-like numbers, addresses and your name.

| Route | What you need | Where your text goes |
| --- | --- | --- |
| Gemini API (free tier) | A free key from [Google AI Studio](https://aistudio.google.com/apikey) | Google. Free-tier requests may be used to improve Google's products. |
| OpenRouter (free models) | A free key from [openrouter.ai](https://openrouter.ai/settings/keys). Only models ending in `:free` can be used. | The company that runs the chosen model |
| In-browser model (WebLLM) | A browser with WebGPU (recent Chrome or Edge on a laptop) and a one-time download of up to about 2 GB on Wi-Fi | Nowhere. It runs on your device. |
| Ollama | [Ollama](https://ollama.com) on your own computer | Nowhere. It runs on your computer. |

Keys stay in the browser's memory and disappear when you close the tab, unless you tick
**Save key on this device**. **Forget key** removes a key at once.

### Use Ollama with Career Navigator

Ollama only answers websites you allow. Allow this site once, then restart Ollama:

- **Windows (PowerShell):** `setx OLLAMA_ORIGINS "https://mokhalil3791.github.io"`, then quit Ollama from the tray and start it again.
- **macOS:** `launchctl setenv OLLAMA_ORIGINS "https://mokhalil3791.github.io"`, then restart the Ollama app.
- **Linux:** `sudo systemctl edit ollama`, add `Environment="OLLAMA_ORIGINS=https://mokhalil3791.github.io"`, then `sudo systemctl restart ollama`.

Then run `ollama pull llama3.2` and choose **Ollama** in Free AI routes. If you run your own fork, use your own site address instead.

## Your privacy

- Your work stays in this browser. Saving on the device is off until you switch it on.
- Nothing is sent to an AI until you copy it yourself.
- Do not enter your BSN, passport, residence permit or health details. The app never asks for them.
- A backup is a readable file. Keep it private.

## Independence

Career Navigator is an independent, open-source tool. No employer, training provider or partner organisation
endorses it, and it makes no hiring decisions. It does not give legal, immigration, tax or benefits advice.

## What v1 adds

- Free built-in AI: Gemini free tier, OpenRouter free models, Ollama, or a model inside your browser. Copy-paste always works.
- AI suggestions are shown as changes that you accept or reject. Evidence quotes are checked against your own profile.
- Dutch interface (machine-assisted, under review), plus sourced cards about the Dutch job market.
- CV import (PDF, Word, text) in your browser, Word (DOCX) export, an applications tracker and calendar (.ics) reminders.
- A free coach view: share one file (optionally protected with a passphrase), get notes back.

## Make it your own

- [Customise](docs/CUSTOMISING.md): add a role, prompt, language, question pack or free AI provider; rebrand; switch modules on or off.
- [Deploy your own copy](docs/DEPLOY.md) to GitHub Pages without a command line.
- [Ready-made prompts for AI coding assistants](starter-prompts/).

## For developers

Read [`docs/PRD.md`](docs/PRD.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`AGENTS.md`](AGENTS.md). Privacy: [`docs/PRIVACY.md`](docs/PRIVACY.md).

```
npm install
npm test              # unit, parity and guardrail tests
npm run build:all     # app + GitHub Pages site into _site/ (v1 at /next/)
npm run build:single  # one-file release for USB sticks
npm run e2e           # Playwright end-to-end tests (after build:all)
```

## Licence

Code: [MIT](LICENSE). Content (prompts, roles, knowledge cards): [CC BY 4.0](LICENSE-content.md),
© Career Navigator contributors. Learning maps adapted from [roadmap.sh](https://roadmap.sh).
