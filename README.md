# README Exporter

A Chrome Manifest V3 extension that exports GitHub repository READMEs and profile READMEs to PDF or HTML.

## Features

- Export PDF through Chrome's native print dialog.
- Detect README content on repository pages and GitHub profile pages.
- Export a standalone HTML document with computed styles copied from the rendered GitHub DOM.
- Preserve the README container, border, header, typography, colors, tables, code blocks, and image references.
- Keep links as absolute URLs.

## Install in Chrome

### From a GitHub release

1. Open the [Releases page](https://github.com/sans-script/READMEExporter/releases).
2. Download the latest `READMEExporter-vX.Y.Z.zip` asset.
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
git tag v0.1.1
git push origin v0.1.1
```

After the workflow completes, the ZIP will be available on the [Releases page](https://github.com/sans-script/READMEExporter/releases).

## HTML export notes

The HTML export copies computed styles onto the cloned README elements, including generated pseudo-element styles where available. Image and other resource URLs are normalized to absolute URLs. This keeps the document's structure and styling in the exported file, but externally hosted images and media still require an internet connection. The HTML is not a fully offline, asset-embedded archive.

## Known limitations

- PDF paper size, margins, headers/footers, and background printing remain controlled by Chrome's print dialog.
- Very long tables, code blocks, and large images may require print-layout refinements.
- Content loaded only after scrolling may not be fully available at export time.
- Some dynamic widgets and styles that depend on GitHub's live JavaScript may not be reproduced in the static HTML.
