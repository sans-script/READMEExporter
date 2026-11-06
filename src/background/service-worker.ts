import type { ExtensionMessage, Paper, PrintToPdfResponse } from "../shared/types";

// Renders the sender's tab to PDF through the DevTools protocol, which gives
// exact paper size and no print dialog. Chrome shows a "debugging" banner
// while attached; we detach as soon as the PDF is produced.
async function printTabToPdf(tabId: number, paper: Paper): Promise<string> {
  const target = { tabId };
  await chrome.debugger.attach(target, "1.3");
  try {
    const result = (await chrome.debugger.sendCommand(target, "Page.printToPDF", {
      printBackground: true,
      paperWidth: paper.width,
      paperHeight: paper.height,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
    })) as { data: string };
    return result.data;
  } finally {
    await chrome.debugger.detach(target).catch(() => undefined);
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse: (response: PrintToPdfResponse) => void) => {
    if (message.type !== "PRINT_TAB_TO_PDF" || sender.tab?.id === undefined) return false;
    printTabToPdf(sender.tab.id, message.paper).then(
      (data) => sendResponse({ data }),
      (error: unknown) => sendResponse({ error: error instanceof Error ? error.message : String(error) }),
    );
    return true; // keep the channel open for the async response
  },
);
