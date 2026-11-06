import { findReadme, getReadmeTitle } from "./detector";

const EXPORT_UI_SELECTOR = "#readme-exporter-controls";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function copyComputedStyles(source: Element, target: Element, pseudoRules: string[], nodeIndex: number): void {
  const computed = window.getComputedStyle(source);
  const targetStyle = (target as HTMLElement | SVGElement).style;

  for (let index = 0; index < computed.length; index += 1) {
    const property = computed.item(index);
    targetStyle.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property));
  }

  const nodeId = "readme-export-node-" + nodeIndex;
  target.setAttribute("data-readme-export-node", nodeId);

  for (const pseudo of ["::before", "::after"] as const) {
    const pseudoStyle = window.getComputedStyle(source, pseudo);
    const content = pseudoStyle.getPropertyValue("content");
    if (!content || content === "none" || content === "normal") continue;

    const declarations: string[] = [];
    for (let index = 0; index < pseudoStyle.length; index += 1) {
      const property = pseudoStyle.item(index);
      const value = pseudoStyle.getPropertyValue(property);
      if (value) declarations.push(property + ": " + value + ";");
    }
    if (declarations.length) {
      pseudoRules.push('[data-readme-export-node="' + nodeId + '"]' + pseudo + " { " + declarations.join(" ") + " }");
    }
  }
}

function normalizeResourceAttributes(root: Element): void {
  const elements = [root, ...Array.from(root.querySelectorAll("*"))];

  for (const element of elements) {
    if (element instanceof HTMLImageElement) {
      const source = element.currentSrc || element.src;
      if (source) element.setAttribute("src", source);
      element.removeAttribute("srcset");
      element.loading = "eager";
      element.decoding = "sync";
    }

    if (element instanceof HTMLSourceElement) {
      if (element.src) element.setAttribute("src", element.src);
      element.removeAttribute("srcset");
    }

    if (element instanceof HTMLAnchorElement && element.hasAttribute("href")) {
      element.href = element.href;
    }

    if (element instanceof HTMLMediaElement && element.currentSrc) {
      element.src = element.currentSrc;
      element.removeAttribute("autoplay");
    }

    for (const attribute of ["poster", "src", "href"]) {
      const value = element.getAttribute(attribute);
      if (!value || value.startsWith("#") || value.startsWith("data:")) continue;
      try {
        element.setAttribute(attribute, new URL(value, document.baseURI).href);
      } catch {
        // Preserve the original value when it is not a valid URL.
      }
    }
  }
}

export function exportReadmeAsHtml(): void {
  const readme = findReadme();
  if (!readme) {
    window.alert("No rendered GitHub README was found on this page.");
    return;
  }

  const title = getReadmeTitle(readme);
  const clone = readme.cloneNode(true) as HTMLElement;
  const sourceElements = [readme, ...Array.from(readme.querySelectorAll("*"))];
  const cloneElements = [clone, ...Array.from(clone.querySelectorAll("*"))];
  const pseudoRules: string[] = [];

  sourceElements.forEach((source, index) => {
    const target = cloneElements[index];
    if (target) copyComputedStyles(source, target, pseudoRules, index);
  });

  clone.querySelectorAll(EXPORT_UI_SELECTOR).forEach((controls) => controls.remove());
  normalizeResourceAttributes(clone);

  const bodyStyle = window.getComputedStyle(document.body);
  const background = bodyStyle.backgroundColor;
  const foreground = bodyStyle.color;
  const html = "<!doctype html>\n" +
    '<html lang="' + escapeHtml(document.documentElement.lang || "en") + '">\n' +
    "<head>\n" +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<title>" + escapeHtml(title) + "</title>\n" +
    "<style>\n" +
    "*, *::before, *::after { box-sizing: border-box; }\n" +
    "html { background: " + background + "; color: " + foreground + "; }\n" +
    "body { margin: 0; padding: 24px; background: " + background + "; color: " + foreground + "; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n" +
    "#readme-exporter-document { width: fit-content; max-width: 100%; margin: 0 auto; }\n" +
    "img, video, svg { max-width: 100%; }\n" +
    pseudoRules.join("\n") + "\n" +
    "@media (max-width: 700px) { body { padding: 12px; } #readme-exporter-document { width: 100%; } }\n" +
    "</style>\n</head>\n<body>\n" +
    '<main id="readme-exporter-document">' + clone.outerHTML + "</main>\n" +
    "</body>\n</html>";

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = title + ".html";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
}
