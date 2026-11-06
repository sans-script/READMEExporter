import "./popup.css";

const status = document.querySelector<HTMLParagraphElement>("#status");
const pdfButton = document.querySelector<HTMLButtonElement>("#export-pdf");
const htmlButton = document.querySelector<HTMLButtonElement>("#export-html");

async function initialize(): Promise<void> {
  if (!status || !pdfButton || !htmlButton) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id || !tab.url?.startsWith("https://github.com/")) {
    status.textContent = "Open a GitHub repository page to export its README.";
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "README_EXPORT_STATUS" });
    if (response?.available) {
      status.textContent = response.profile
        ? "GitHub profile found. It will be exported as a resume."
        : "A rendered README was found on this page.";
      pdfButton.disabled = false;
      htmlButton.disabled = false;
    } else {
      status.textContent = "No rendered README was found on this page.";
    }
  } catch {
    status.textContent = "This GitHub page is not ready. Reload it and try again.";
  }
}

async function exportFormat(format: "PDF" | "HTML"): Promise<void> {
  const button = format === "PDF" ? pdfButton : htmlButton;
  if (!button) return;

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Preparing…";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error("No active tab");

    await chrome.tabs.sendMessage(tab.id, {
      type: format === "PDF" ? "EXPORT_README_PDF" : "EXPORT_README_HTML",
    });
    window.close();
  } catch {
    if (status) status.textContent = "Could not start export. Reload the GitHub page.";
    button.disabled = false;
    button.textContent = originalText;
  }
}

pdfButton?.addEventListener("click", () => void exportFormat("PDF"));
htmlButton?.addEventListener("click", () => void exportFormat("HTML"));
void initialize();
