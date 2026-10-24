# Privacy notice — Career Navigator

*Plain English. Last updated 2026-10-25. Nederlandse versie: [PRIVACY.nl.md](PRIVACY.nl.md).*

Career Navigator is a free, open-source tool that runs **in your browser**. This notice is written in the
style of a GDPR (AVG) privacy notice, even though the maintainers do not receive or process your data.

## The short version
- **We do not collect anything.** There is no account, no server and no analytics, and no cookies are used for tracking.
- **Your work stays in your browser.** It is gone when you close the page, unless *you* switch on **Save on this device**.
- **You choose what to share.** The exact prompt is always available to inspect. Copying opens a chat homepage without sending your prompt; direct sending requires you to view and confirm the text first.
- **Do not enter** your BSN, passport, residence permit or health information. The app never asks for them, and has no fields for refugee or residence status, nationality, date of birth or a photo.

## Who is responsible
Career Navigator is maintained by volunteer "Career Navigator contributors". No employer, training provider
or partner organisation runs or endorses it. Because the app has no server, the maintainers **cannot see,
store or delete your data**. You control it in your own browser.

## What is stored, and where
| What | Where | How long | How to remove it |
| --- | --- | --- | --- |
| Your workspace (profile, adverts, CV, plan, drafts) | Your browser's memory | Until you close or reload the page | Close the page |
| The same, if you switch on **Save on this device** | Your browser (IndexedDB), on this device only | Until you switch it off or delete it | **Your data → Clear my workspace** or **Delete everything** |
| An AI key, if you tick **Save key on this device** | Your browser (IndexedDB) | Until you click **Forget key** or **Delete everything** | **Forget key** |
| WebLLM, if you download it in Advanced | This app's browser cache | Until you delete it | **Delete everything** |
| AI downloaded by your browser for **Run on this computer** | Storage managed by your browser | Managed by your browser | Your browser's controls, not this app's **Delete everything** |
| Backups, CVs, work packs and coach packs you download | Your device's files | As long as you keep them | Delete the files |

## When data leaves your device
Only when **you** do it:
1. **Copy-paste:** **Copy and open** puts the prompt on your clipboard and opens your chosen chat's homepage. No workspace text is put in a link. You paste and send it yourself; that chat's terms and privacy policy apply. **Share to app** passes the text to the app you choose. **Paste the answer** requests clipboard access only when pressed; a normal text box works if access is denied. Your chat choice is kept with your workspace, subject to the same device-saving opt-in.
2. **Built-in AI:** you choose a provider (Gemini, OpenRouter, Ollama on your own computer, or the in-browser model), see the exact text and the destination, and press **Send**.
   - **Gemini free tier:** Google may use free-tier requests to improve its products.
   - **OpenRouter:** each free model has its own data policy.
   - **Ollama and the in-browser model:** nothing leaves your device.
3. **Sharing a file:** you send a backup or coach pack to someone yourself, for example by email or WhatsApp. These files contain personal details. Share them only with people you trust, and use the optional passphrase.
4. **Links:** when you open a link (for example to werk.nl), that website's own privacy policy applies.

**Run on this computer** checks support locally and asks before a large browser-managed download. Your prompt stays on this computer. In **Settings → Advanced**, connecting OpenRouter fetches its public list of free choices; this request contains no workspace text or credentials. The public `/prompts/` library has prefilled chat links containing only the displayed public prompt, never your workspace.

**Redact before sending** masks common personal details (email, phone, BSN-like numbers, bank accounts, addresses, your name). It is a help, not a guarantee: always read the text first.

## The website itself
The app is hosted on GitHub Pages. GitHub may keep technical server logs, such as your IP address, when
you load the page, as described in the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
Career Navigator adds no tracking of its own.

## Your rights
Because the maintainers hold no data about you, there is nothing for us to show, correct or delete. You can
remove everything yourself with **Delete everything**. For questions, open an issue on GitHub, but **never
post personal details there**, because issues are public.
