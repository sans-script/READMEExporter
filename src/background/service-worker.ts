import type { ExtensionMessage, PdfResponse } from "../shared/types";

// Renders the sender's tab to PDF through the DevTools protocol, which gives
// exact paper size and no print dialog. Chrome shows a "debugging" banner
// while attached; we detach as soon as the PDF is produced.
async function handle(message: ExtensionMessage, tabId: number): Promise<string | undefined> {
  const target = { tabId };
  switch (message.type) {
    case "PDF_BEGIN":
      await chrome.debugger.attach(target, "1.3");
      // Measure in print media: GitHub's print styles change element heights.
      await chrome.debugger.sendCommand(target, "Emulation.setEmulatedMedia", { media: "print" });
      return undefined;
    case "PDF_PRINT": {
      const result = (await chrome.debugger.sendCommand(target, "Page.printToPDF", {
        printBackground: true,
        scale: Math.min(2, Math.max(0.1, message.scale)), // CDP accepts 0.1–2
        paperWidth: message.paper.width,
        paperHeight: message.paper.height,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      })) as { data: string };
      return result.data;
    }
    case "PDF_END":
      await chrome.debugger.detach(target).catch(() => undefined); // already detached is fine
      return undefined;
    default:
      return undefined;
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse: (response: PdfResponse) => void) => {
    if (!message.type.startsWith("PDF_") || sender.tab?.id === undefined) return false;
    handle(message, sender.tab.id).then(
      (data) => sendResponse({ ok: true, data }),
      (error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }),
    );
    return true; // keep the channel open for the async response
  },
);
