# Yan Biyu Global Concept – Offline Invoice Generator
Vanilla HTML/CSS/JS PWA. No frameworks, no internet needed after first load.

## Run
Service workers need http://localhost or https (not file://). In this folder run ONE of:
- `python -m http.server 8080`  → open http://localhost:8080
- `npx serve .`
Or upload the folder to any free HTTPS host (Netlify, GitHub Pages) and open it once online.

## Install
Open the app once while online (this caches it). Then use the **Install App** button (or browser menu → Install / Add to Home Screen). It then works fully offline.

## Notes
- Invoices live in this browser's IndexedDB on this device only. Use **Backup → Export** regularly; **Restore** merges a backup file.
- PDF is built in-app (no libraries; amounts show as "NGN" in the PDF because the standard PDF font has no ₦ glyph). **Print Invoice** uses the browser dialog (A4) and shows the ₦ sign.
- Files (all in one folder): index.html, style.css, app.js, sw.js, manifest.webmanifest, icon files.
- After editing any file, bump `V` in sw.js so devices refresh the cache.

## Cross-platform (one codebase)
Works as an installable PWA on Android (Chrome) and Windows 10/11 (Chrome or Edge). Nothing is loaded from the internet; there are no external libraries.

**No automatic sync.** Each device stores its own invoices and works independently offline. To move records between Android and Windows: Backup → Export on one device, send the JSON file (WhatsApp/email/USB), then Backup → Restore on the other.

## Install – Android (Chrome)
1. Open the app link in Chrome while online; let it load fully.
2. Tap the ⋮ menu → **Install app** (or **Add to Home screen**) → **Install**.
3. Launch from the home screen (icon + splash screen shown; works offline).

## Install – Windows 10/11 with Chrome
1. Open the app link in Chrome while online.
2. Click the install icon in the address bar (or ⋮ → Cast, save and share → Install page as app) → **Install**.
3. Launch from Desktop or Start menu.

## Install – Windows 10/11 with Edge
1. Open the app link in Edge while online.
2. … menu → Apps → **Install this site as an app** → **Install**.
3. Allow Desktop/Start menu shortcuts and launch from there.

## Sharing PDFs
"Share PDF" uses the phone's share sheet (WhatsApp, email, etc.) on Android. Where sharing isn't supported (most desktops) it downloads the PDF instead.
Note: installation and sharing need the app served over HTTPS (or localhost), so host it once on an HTTPS site such as Netlify or GitHub Pages; Android phones can't use "localhost" from your PC.
