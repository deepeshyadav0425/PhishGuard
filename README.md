# PhishGuard

PhishGuard is a browser-based phishing triage demo. It inspects URLs, QR-code payloads, pasted email text, and batches of URLs using local heuristics. It does not need an API key or backend.

## Features

- Inspect URL structure, suspicious wording, Unicode lookalikes, redirects, and other local indicators.
- Decode QR images and optionally use a camera, then inspect an extracted URL.
- Paste email headers and body to compare sender fields and inspect embedded links.
- Audit multiple URLs and export CSV, case reports, or IOC JSON.
- Run a small labeled URL fixture set and review precision, recall, accuracy, and F1.
- Keep scan history in browser storage and cache the app for offline use.

## Run locally

Use a local web server so the service worker can be enabled. From the project folder:

```powershell
py -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). If the Python launcher is unavailable, use any static file server. Opening the HTML file directly still works, but browsers do not allow service-worker registration from `file://`.

## Automated tests

Requirements: Node.js 20 or newer and npm.

```powershell
npm install --no-package-lock
npx playwright install chromium
npm test
```

The Playwright suite checks that the homepage and offline assets load, email triage flags test indicators, labeled URL fixtures produce the expected predictions, and report/CSV exports work. The first run downloads Playwright and its browser.

## Publish and test on GitHub for free

1. Create a GitHub repository and upload the project files, including `vendor/`, `.github/`, `tests/`, `scripts/`, `package.json`, and this README.
2. Push the default branch named `main`. The **PhishGuard CI and Pages** workflow installs the test browser, runs the automated suite, builds the static site, and deploys it to GitHub Pages after successful tests.
3. In repository **Settings → Pages**, set the build and deployment source to **GitHub Actions** if it is not already selected.
4. Open the Pages URL shown in the workflow deployment summary.

Pull requests to `main` run the tests but do not publish the site. You can also start the workflow manually from the repository’s **Actions** tab.

## Privacy and limitations

- URL and email analysis runs in the visitor’s browser. URL scan history is stored in that browser’s local storage; clearing browser data or using a different browser/device removes or changes that history.
- No DNS, WHOIS, reputation, or online SPF/DKIM/DMARC checks are performed. Authentication results in pasted email headers are treated as unverified text.
- The classifier is heuristic. A low score is not proof that a URL is safe, and a high score is not authoritative confirmation of abuse.
- The labeled test set is small and curated for regression checks; its metrics do not represent real-world performance.
- The page uses a bundled Tailwind browser build for convenience. For production use, consider generating and committing static CSS with the Tailwind CLI.

## Project files

- `index.html` redirects visitors to the main app page.
- `PhishGuard_API_Free.html` contains the app and local analysis logic.
- `vendor/` contains the bundled QR decoder and Tailwind runtime.
- `service-worker.js` provides offline caching on localhost and HTTPS.
- `tests/` contains the browser tests and local test server.
- `.github/workflows/test-and-deploy.yml` runs CI and deploys successful builds to GitHub Pages.

This repository does not include a license. Add a license if you want to grant others permission to reuse or modify the project.
