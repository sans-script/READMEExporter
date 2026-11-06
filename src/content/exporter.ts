import { findReadme, getReadmeTitle } from "./detector";
import { buildResume, defaultPaper, fitToPage, getResumeTitle, isProfilePage, waitForImages } from "./resume";
import type { ExtensionMessage, PdfResponse } from "../shared/types";

let printing = false;

function downloadPdf(base64: string, filename: string): void {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// Profile pages: build the resume, fit it to one page and render it to PDF
// in the background worker (no print dialog).
async function pdfStep(message: ExtensionMessage): Promise<string | undefined> {
  const response = (await chrome.runtime.sendMessage(message)) as PdfResponse;
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

export async function exportProfilePdf(readmeOnly = false): Promise<void> {
  if (printing) return;
  printing = true;

  const resume = buildResume(readmeOnly);
  document.body.classList.add("readme-exporter-printing");
  // print.css sets "@page { size: A4; margin: 8mm }" for README printing.
  // Chrome lays out at the CSS page size and then shrinks it onto the paper,
  // so the page box must match the paper exactly, with no margins.
  const paper = defaultPaper();
  const pageStyle = document.createElement("style");
  pageStyle.textContent = "@page { size: " + paper.width + "in " + paper.height + "in !important; margin: 0 !important; }";
  document.head.append(pageStyle);
  try {
    await waitForImages(resume);
    await pdfStep({ type: "PDF_BEGIN" });
    const scale = fitToPage(resume, paper); // measured while print media is emulated
    const data = await pdfStep({ type: "PDF_PRINT", paper, scale });
    if (!data) throw new Error("The PDF renderer returned no data.");
    downloadPdf(data, getResumeTitle(readmeOnly) + ".pdf");
  } catch (error) {
    window.alert("PDF export failed: " + (error instanceof Error ? error.message : String(error)));
  } finally {
    await pdfStep({ type: "PDF_END" }).catch(() => undefined);
    pageStyle.remove();
    document.body.classList.remove("readme-exporter-printing");
    resume.remove();
    printing = false;
  }
}

export async function exportReadme(): Promise<void> {
  if (isProfilePage()) return exportProfilePdf();
  if (printing) return;

  const readme = findReadme();
  if (!readme) {
    window.alert("No rendered GitHub README was found on this page.");
    return;
  }

  printing = true;
  const previousTitle = document.title;
  const exportTitle = getReadmeTitle(readme);

  document.title = exportTitle;

  const restore = () => {
    document.title = previousTitle;
    printing = false;
    window.removeEventListener("afterprint", restore);
  };

  window.addEventListener("afterprint", restore, { once: true });

  // Let the browser finish applying the print stylesheet before opening
  // the native print dialog.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.print());
  });

  // Some browser/platform combinations do not reliably dispatch afterprint
  // when the print dialog is cancelled. The next visibility transition is
  // a secondary restoration path.
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible" && printing) {
      restore();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
}
