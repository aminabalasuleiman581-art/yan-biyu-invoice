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
- Files: index.html, css/style.css, js/app.js, sw.js, manifest.webmanifest, icons/.
- After editing any file, bump `V` in sw.js so devices refresh the cache.
