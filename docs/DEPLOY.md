# Deploy your own copy to GitHub Pages (no command line)

This takes about 10 minutes and costs nothing. You need a free GitHub account.

1. **Make your copy.** On https://github.com/mokhalil3791/career-navigator, click **Use this template → Create a new repository**.
   Give it a name (for example `career-navigator`), choose **Public**, and click **Create repository**.
2. **Switch on Pages.** In your new repository, go to **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. **Run the first deploy.** Go to **Actions → Deploy to GitHub Pages → Run workflow**. Wait until the job has a green tick (about 3 minutes).
4. **Open your site.** It is at `https://<your-user-name>.github.io/<repository-name>/`.
   - `/` is the original v0.1 workshop app (until the maintainers switch it over)
   - `/next/` is the v1 app
   - `/prompts/` is the public prompt library
5. **Change things in the browser.** Open any file on GitHub and click the pencil, or press `.` to open the web editor.
   Commit to `main`, and the site redeploys by itself. See [CUSTOMISING.md](CUSTOMISING.md) for safe changes.

**If the deploy fails:** open the failed job in **Actions** and read the red step. A failing test usually means a
content file has a typo. The message names the file and the field.

**QR codes for your own site:** the QR codes in `assets/qr/` point to the official site. To make your own, ask a
helper with a computer to run `npm run build:qr` after changing `SITE_URL` in `scripts/lib/prompts-page.mjs`.

**Ollama users:** set `OLLAMA_ORIGINS` to your own site address (see the README).
