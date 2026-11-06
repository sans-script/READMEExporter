import { findReadme } from "./detector";
import { exportReadme } from "./exporter";
import { exportReadmeAsHtml } from "./html-exporter";
import type { ExtensionMessage } from "../shared/types";

const PDF_BUTTON_ID = "readme-exporter-pdf-button";
const HTML_BUTTON_ID = "readme-exporter-html-button";

function createButton(id: string, label: string, title: string, action: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = id;
  button.type = "button";
  button.textContent = label;
  button.title = title;
  button.addEventListener("click", action);
  return button;
}

function mountButtons(): void {
  const readme = findReadme();
  if (!readme || document.getElementById(PDF_BUTTON_ID)) return;

  const header = readme.querySelector<HTMLElement>(".Box-header, [data-testid='readme-header']");
  const controls = document.createElement("span");
  controls.id = "readme-exporter-controls";
  controls.append(
    createButton(PDF_BUTTON_ID, "Export PDF", "Export using Chrome's native print dialog", exportReadme),
    createButton(HTML_BUTTON_ID, "Export HTML", "Download a styled HTML copy of this README", exportReadmeAsHtml),
  );

  if (header) {
    header.append(controls);
    controls.classList.add("readme-exporter-inline");
  } else {
    document.body.append(controls);
    controls.classList.add("readme-exporter-floating");
  }
}

function installStyles(): void {
  if (document.getElementById("readme-exporter-ui-styles")) return;

  const style = document.createElement("style");
  style.id = "readme-exporter-ui-styles";
  style.textContent = `
    #readme-exporter-controls {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      z-index: 9999;
    }
    #readme-exporter-controls button {
      appearance: none;
      border: 1px solid #3d444d;
      border-radius: 6px;
      background: #238636;
      color: #fff;
      cursor: pointer;
      font: 600 12px/20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 4px 10px;
    }
    #readme-exporter-controls button:hover { background: #2ea043; }
    #readme-exporter-controls button:focus-visible { outline: 2px solid #58a6ff; outline-offset: 2px; }
    #readme-exporter-controls.readme-exporter-inline { float: right; margin-left: 8px; }
    #readme-exporter-controls.readme-exporter-floating { position: fixed; right: 20px; bottom: 20px; }
    @media print { #readme-exporter-controls { display: none !important; } }
  `;

  document.documentElement.append(style);
}

installStyles();
mountButtons();

const observer = new MutationObserver(() => mountButtons());
observer.observe(document.documentElement, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "README_EXPORT_STATUS") {
      sendResponse({ available: Boolean(findReadme()), title: document.title });
      return false;
    }

    if (message.type === "EXPORT_README_PDF") {
      const available = Boolean(findReadme());
      if (available) exportReadme();
      sendResponse({ available });
      return false;
    }

    if (message.type === "EXPORT_README_HTML") {
      const available = Boolean(findReadme());
      if (available) exportReadmeAsHtml();
      sendResponse({ available });
      return false;
    }

    return false;
  },
);
