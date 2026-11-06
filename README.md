# README Exporter

A Chrome Manifest V3 extension that exports GitHub's already-rendered README to PDF or HTML.

## Features

- Export PDF through Chrome's native print dialog.
- Export a standalone HTML document with computed styles copied from the rendered GitHub DOM.
- Preserve the README container, border, header, typography, colors, tables, code blocks, and image references.
- Keep links as absolute URLs.

## Development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run build
```

Load the unpacked extension from the generated `dist/` directory:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Select **Load unpacked**.
4. Choose this project's `dist/` directory.
5. Open a GitHub repository page containing a rendered README.
6. Use **Export PDF** or **Export HTML** in the README header or extension popup.

## HTML export notes

The HTML export copies computed styles onto the cloned README elements, including generated pseudo-element styles where available. Image and other resource URLs are normalized to absolute URLs. This keeps the document's structure and styling in the exported file, but externally hosted images and media still require an internet connection. The HTML is not a fully offline, asset-embedded archive.

## Known limitations

- PDF paper size, margins, headers/footers, and background printing remain controlled by Chrome's print dialog.
- Very long tables, code blocks, and large images may require print-layout refinements.
- Content loaded only after scrolling may not be fully available at export time.
- Some dynamic widgets and styles that depend on GitHub's live JavaScript may not be reproduced in the static HTML.
