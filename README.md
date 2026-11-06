# Profile Exporter

A Chrome Manifest V3 extension that turns a GitHub profile into a one-page resume PDF, and exports any GitHub README to PDF or HTML.

## Features

- **Profile resume (Export PDF):** on a GitHub profile, builds a resume from the rendered page — avatar, name, bio, contact links, the profile README, pinned projects, achievements, highlights and organizations — and downloads it as a single-page PDF. GitHub's own icons, fonts and formatting are kept; page chrome (follow/sponsor buttons, tabs, copy buttons) is removed.
- **README only (Export README):** on a profile, downloads just the bordered README box, spanning the full sheet.
- **Exact page fit:** the PDF is rendered with Chrome's DevTools `Page.printToPDF` (no print dialog). The layout is widened to the paper's aspect ratio and scaled to fill exactly one page — A4, or Letter when the browser language is en-US/en-CA.
- **Repository READMEs:** on repository pages, Export PDF opens Chrome's print dialog with the README only.
- **HTML export:** a standalone HTML document with computed styles copied from the rendered GitHub DOM; links are absolute URLs.

### Permissions

- `debugger` — used only while exporting a profile PDF, to call `Page.printToPDF`. Chrome shows a "Profile Exporter started debugging this browser" banner for a second or two; the extension detaches as soon as the PDF is produced.

## Install in Chrome

### From a GitHub release

1. Open the [Releases page](https://github.com/sans-script/READMEExporter/releases).
2. Download the `ProfileExporter-<version>.zip` asset attached to the latest release.
3. Extract the ZIP file into a folder.
4. Open `chrome://extensions` in Chrome.
5. Enable **Developer mode**.
6. Select **Load unpacked** and choose the extracted folder.

### Build from source

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run build
```

Then load the generated `dist/` directory through `chrome://extensions` → **Developer mode** → **Load unpacked**.

## Releases

Every pushed tag matching `v*` triggers the GitHub Actions release workflow. It builds the extension and attaches a ZIP containing the contents of `dist/` to a GitHub Release.

To publish a new version:

```bash
git tag v0.3.0
git push origin v0.3.0
```

After the workflow completes, the ZIP will be available on the [Releases page](https://github.com/sans-script/READMEExporter/releases).

## Example export

[Download the exported GitHub profile README as PDF](artifacts/alexandre-santos-github-profile.pdf). This sample was rendered from the maintainer's public GitHub profile on 2026-11-06.

## HTML export notes

The HTML export copies computed styles onto the cloned README elements, including generated pseudo-element styles where available. Image and other resource URLs are normalized to absolute URLs. This keeps the document's structure and styling in the exported file, but externally hosted images and media still require an internet connection. The HTML is not a fully offline, asset-embedded archive.

## Known limitations

- For repository READMEs, PDF paper size, margins, headers/footers, and background printing remain controlled by Chrome's print dialog.
- Very long tables, code blocks, and large images may require print-layout refinements.
- Content loaded only after scrolling may not be fully available at export time.
- Some dynamic widgets and styles that depend on GitHub's live JavaScript may not be reproduced in the static HTML.
